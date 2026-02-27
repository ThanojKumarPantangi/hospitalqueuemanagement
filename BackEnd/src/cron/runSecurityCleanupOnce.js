// RENDER
import dotenv from "dotenv";
import connectDB from "../config/database.config.js";

import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import Message from "../models/message.model.js";

dotenv.config({ path: "./src/.env" });

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

const run = async () => {
  try {
    await connectDB();

    console.log("🧹 Running security & message cleanup (one time)...");

    const now = new Date();

    /**
     * 1) Delete revoked refresh tokens older than 7 days
     */
    const revokedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const deletedRevokedRefresh = await RefreshToken.deleteMany({
      revoked: true,
      updatedAt: { $lt: revokedBefore },
    });

    /**
     * 2) Delete used password reset tokens older than 1 day
     */
    const usedBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deletedUsedResets = await PasswordReset.deleteMany({
      used: true,
      updatedAt: { $lt: usedBefore },
    });

    /**
     * 3) Deactivate stale sessions (>10 days)
     */
    const inactiveBefore = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const deactivatedSessions = await Session.updateMany(
      { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
      { isActive: false }
    );

    /**
     * 4) 🔥 Delete expired ANNOUNCEMENTS (end of IST day)
     */
    const todayIST = getStartOfISTDay();

    const deletedAnnouncements = await Message.deleteMany({
      type: "ANNOUNCEMENT",
      createdAt: { $lt: todayIST },
    });

    console.log("✅ Cleanup done:", {
      deletedRevokedRefresh: deletedRevokedRefresh.deletedCount,
      deletedUsedResets: deletedUsedResets.deletedCount,
      deactivatedSessions: deactivatedSessions.modifiedCount,
      deletedAnnouncements: deletedAnnouncements.deletedCount,
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
};

run();
