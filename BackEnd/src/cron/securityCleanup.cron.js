import cron from "node-cron";
import redis from "../config/redisClient.js";

import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import Message from "../models/message.model.js";

/* ============================
   SECURITY + MESSAGE CLEANUP CRON
============================ */

export const startSecurityCleanupCron = () => {

  if (process.env.ENABLE_INTERNAL_CRON !== "true") {
    console.log("Internal cron disabled");
    return;
  }

  console.log("Security cleanup cron started...");

  cron.schedule(
    "0 3 * * *",
    async () => {

      const lockKey = "cron:security_cleanup_lock";

      try {

        /* ============================
           DISTRIBUTED LOCK
        ============================ */

        const lock = await redis.set(
          lockKey,
          "locked",
          { nx: true, ex: 600 } 
        );

        if (!lock) {
          console.log("Cleanup skipped (another instance running)");
          return;
        }

        const now = new Date();

        /* ============================
           REFRESH TOKEN CLEANUP
        ============================ */

        const revokedBefore = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        await RefreshToken.deleteMany({
          revoked: true,
          updatedAt: { $lt: revokedBefore }
        });

        /* ============================
           PASSWORD RESET CLEANUP
        ============================ */

        const usedBefore = new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        );

        await PasswordReset.deleteMany({
          used: true,
          updatedAt: { $lt: usedBefore }
        });

        /* ============================
           SESSION CLEANUP
        ============================ */

        const inactiveBefore = new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000
        );

        await Session.updateMany(
          { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
          { $set: { isActive: false } }
        );

        const invalidBefore = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        await Session.deleteMany({
          $or: [
            { isActive: false },
            { expiresAt: { $lte: now } }
          ],
          updatedAt: { $lt: invalidBefore }
        });

        /* ============================
           MESSAGE CLEANUP
        ============================ */

        // delete expired announcements
        await Message.deleteMany({
          type: "ANNOUNCEMENT",
          expiresAt: { $lte: now }
        });

        // delete old chat messages (>90 days)
        const messageRetention = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );

        await Message.deleteMany({
          type: "QUEUE",
          createdAt: { $lt: messageRetention }
        });

        await Device.updateMany(
          {
            isTrusted: true,
            trustExpiresAt: { $lte: now },
          },
          {
            $set: {
              isTrusted: false,
              trustExpiresAt: null,
            },
          }
        );

        const deviceInactiveBefore = new Date(
          now.getTime() - 45 * 24 * 60 * 60 * 1000 
        );

        await Device.deleteMany({
          lastUsedAt: { $lt: deviceInactiveBefore },
          isTrusted: false,
        });

        console.log("Cleanup completed successfully");

      } catch (err) {

        console.error("Cleanup failed:", err);

      }

    },
    {
      timezone: "Asia/Kolkata"
    }
  );
};