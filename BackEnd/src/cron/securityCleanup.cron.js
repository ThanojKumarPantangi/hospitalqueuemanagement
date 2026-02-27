import cron from "node-cron";
import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import Message from "../models/message.model.js";

/* ============================
   SECURITY + MESSAGE CLEANUP CRON
============================ */
export const startSecurityCleanupCron = () => {
  if (process.env.ENABLE_INTERNAL_CRON !== "true") {
    console.log("Internal cron disabled ");
    return;
  }

  console.log("Security cleanup cron started...");

  // Runs every day at 3:00 AM
  cron.schedule(
  "0 3 * * *",
    async () => {
      try {
        const now = new Date();

        //  Delete revoked refresh tokens older than 7 days
        const revokedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        await RefreshToken.deleteMany({
          revoked: true,
          updatedAt: { $lt: revokedBefore },
        });

        // Delete used reset tokens older than 1 day
        const usedBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        await PasswordReset.deleteMany({
          used: true,
          updatedAt: { $lt: usedBefore },
        });

        // Deactivate inactive sessions (>10 days)
        const inactiveBefore = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

        await Session.updateMany(
          { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
          { $set: { isActive: false } }
        );

        //  Delete expired announcements
        await Message.deleteMany({
          type: "ANNOUNCEMENT",
          expiresAt: { $lte: now },
        });

        console.log("Cleanup completed");
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};
