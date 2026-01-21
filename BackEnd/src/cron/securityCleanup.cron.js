import cron from "node-cron";
import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";

export const startSecurityCleanupCron = () => {
  if (process.env.ENABLE_INTERNAL_CRON !== "true") {
    console.log("⏸️ Internal cron disabled (ENABLE_INTERNAL_CRON != true)");
    return;
  }

  console.log("✅ Security cleanup cron started...");

  // Runs every day at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("🧹 Running security cleanup cron...");

      const now = new Date();

      /**
       * 1) Cleanup revoked refresh tokens older than 7 days
       */
      const revokedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const deletedRevokedRefresh = await RefreshToken.deleteMany({
        revoked: true,
        updatedAt: { $lt: revokedBefore },
      });

      /**
       * 2) Cleanup used password reset tokens older than 1 day
       */
      const usedBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const deletedUsedResets = await PasswordReset.deleteMany({
        used: true,
        updatedAt: { $lt: usedBefore },
      });

      /**
       * 3) OPTIONAL: Mark sessions inactive if lastSeenAt older than 10 days
       * TTL will delete them anyway, but this helps instantly block access
       */
      const inactiveBefore = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const deactivatedSessions = await Session.updateMany(
        { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
        { isActive: false }
      );

      console.log("✅ Security cleanup done:", {
        deletedRevokedRefresh: deletedRevokedRefresh.deletedCount,
        deletedUsedResets: deletedUsedResets.deletedCount,
        deactivatedSessions: deactivatedSessions.modifiedCount,
      });
    } catch (err) {
      console.log("❌ Security cleanup cron failed:", err.message);
    }
  });
};
