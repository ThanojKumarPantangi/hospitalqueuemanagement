import dotenv from "dotenv";
import connectDB from "../config/database.config.js";

import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordReset from "../models/passwordReset.model.js";

dotenv.config({ path: "./src/.env" });

const run = async () => {
  try {
    await connectDB();

    console.log("🧹 Running security cleanup (one time)...");

    const now = new Date();

    // 1) delete revoked refresh tokens older than 7 days
    const revokedBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedRevokedRefresh = await RefreshToken.deleteMany({
      revoked: true,
      updatedAt: { $lt: revokedBefore },
    });

    // 2) delete used password reset tokens older than 1 day
    const usedBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deletedUsedResets = await PasswordReset.deleteMany({
      used: true,
      updatedAt: { $lt: usedBefore },
    });

    // 3) deactivate old sessions older than 10 days (optional)
    const inactiveBefore = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const deactivatedSessions = await Session.updateMany(
      { isActive: true, lastSeenAt: { $lt: inactiveBefore } },
      { isActive: false }
    );

    console.log("✅ Cleanup done:", {
      deletedRevokedRefresh: deletedRevokedRefresh.deletedCount,
      deletedUsedResets: deletedUsedResets.deletedCount,
      deactivatedSessions: deactivatedSessions.modifiedCount,
    });

    process.exit(0);
  } catch (err) {
    console.log("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
};

run();