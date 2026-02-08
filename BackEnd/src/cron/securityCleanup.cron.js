import cron from "node-cron";
import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import Message from "../models/message.model.js";

/* ============================
   IST DAY HELPER
============================ */
const getStartOfISTDay = (date = new Date()) => {
  const d = new Date(date);

  // Convert to IST (+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);

  // Start of IST day
  istDate.setHours(0, 0, 0, 0);

  // Convert back to UTC for DB comparison
  return new Date(istDate.getTime() - istOffsetMs);
};

/* ============================
   SECURITY + MESSAGE CLEANUP CRON
============================ */
export const startSecurityCleanupCron = () => {
  if (process.env.ENABLE_INTERNAL_CRON !== "true") {
    console.log("⏸️ Internal cron disabled (ENABLE_INTERNAL_CRON != true)");
    return;
  }

  console.log("✅ Security cleanup cron started...");

  // Runs every day at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("🧹 Running security & message cleanup cron...");

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
       * 3) Deactivate stale sessions (last seen > 10 days)
       */
      const inactiveBefore = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const deactivatedSessions = await Session.updateMany(
        { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
        { isActive: false }
      );

      /**
       * 4) 🔥 DELETE EXPIRED ANNOUNCEMENTS (END OF DAY - IST)
       */
      const todayIST = getStartOfISTDay();

      const deletedAnnouncements = await Message.deleteMany({
        type: "ANNOUNCEMENT",
        createdAt: { $lt: todayIST },
      });

      console.log("✅ Cleanup summary:", {
        deletedRevokedRefresh: deletedRevokedRefresh.deletedCount,
        deletedUsedResets: deletedUsedResets.deletedCount,
        deactivatedSessions: deactivatedSessions.modifiedCount,
        deletedAnnouncements: deletedAnnouncements.deletedCount,
      });
    } catch (err) {
      console.error("❌ Cleanup cron failed:", err.message);
    }
  });
};
