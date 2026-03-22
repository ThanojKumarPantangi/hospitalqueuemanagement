import cron from "node-cron";
import redis from "../config/redisClient.js";

import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import Message from "../models/message.model.js";
import Device from "../models/device.model.js";

export const startSecurityCleanupCron = () => {
  if (process.env.ENABLE_INTERNAL_CRON !== "true") {
    console.log("Internal cron disabled");
    return;
  }

  console.log("Security cleanup cron started...");

  cron.schedule(
    "0 3 * * *",
    async () => {
      const startTime = Date.now();
      const lockKey = "cron:security_cleanup_lock";

      let lock = null;

      const metrics = {
        refreshTokensDeleted: 0,
        passwordResetsDeleted: 0,
        sessionsDeactivated: 0,
        sessionsDeleted: 0,
        messagesDeleted: 0,
        queueMessagesDeleted: 0,
        devicesUntrusted: 0,
        devicesDeleted: 0,
        durationMs: 0,
      };

      try {
        //Upstash-Redis lock
        lock = await redis.set(lockKey, "locked", {
          nx: true,
          ex: 600,
        });

        if (!lock) {
          console.log("Cleanup skipped (another instance running)");
          return;
        }

        const now = new Date();

        // REFRESH TOKENS
        const revokedBefore = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        const refreshResult = await RefreshToken.deleteMany({
          revoked: true,
          updatedAt: { $lt: revokedBefore },
        });

        metrics.refreshTokensDeleted = refreshResult.deletedCount;

        // PASSWORD RESET
        const usedBefore = new Date(
          now.getTime() - 24 * 60 * 60 * 1000
        );

        const passwordResult = await PasswordReset.deleteMany({
          used: true,
          updatedAt: { $lt: usedBefore },
        });

        metrics.passwordResetsDeleted = passwordResult.deletedCount;

        // SESSION DEACTIVATION
        const inactiveBefore = new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000
        );

        const sessionDeactivateResult = await Session.updateMany(
          { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
          { $set: { isActive: false } }
        );

        metrics.sessionsDeactivated = sessionDeactivateResult.modifiedCount;

        // SESSION DELETION
        const invalidBefore = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const sessionDeleteResult = await Session.deleteMany({
          $or: [
            {
              isActive: false,
              updatedAt: { $lt: invalidBefore },
            },
            {
              expiresAt: { $lte: now },
            },
          ],
        });

        metrics.sessionsDeleted = sessionDeleteResult.deletedCount;

        // ANNOUNCEMENTS
        const messageResult = await Message.deleteMany({
          type: "ANNOUNCEMENT",
          expiresAt: { $lte: now },
        });

        metrics.messagesDeleted = messageResult.deletedCount;

        // QUEUE MESSAGES
        const messageRetention = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000
        );

        const queueMessageResult = await Message.deleteMany({
          type: "QUEUE",
          createdAt: { $lt: messageRetention },
        });

        metrics.queueMessagesDeleted = queueMessageResult.deletedCount;

        // DEVICE TRUST EXPIRY
        const deviceUntrustResult = await Device.updateMany(
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

        metrics.devicesUntrusted = deviceUntrustResult.modifiedCount;

        // DEVICE CLEANUP
        const deviceInactiveBefore = new Date(
          now.getTime() - 45 * 24 * 60 * 60 * 1000
        );

        const deviceDeleteResult = await Device.deleteMany({
          lastUsedAt: { $lt: deviceInactiveBefore },
          isTrusted: false,
        });

        metrics.devicesDeleted = deviceDeleteResult.deletedCount;

       
        metrics.durationMs = Date.now() - startTime;

        console.log("Cleanup completed", metrics);

      } catch (err) {
        console.error("Cleanup failed:", err);
      } finally {
        
        try {
          if (lock) {
            await redis.del(lockKey);
          }
        } catch (err) {
          console.error("Failed to release lock:", err);
        }
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};