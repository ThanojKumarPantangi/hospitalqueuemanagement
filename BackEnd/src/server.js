process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

import app from "./app.js";
import connectDB from "./config/database.config.js";
import http from "http";
import { initSocket } from "./sockets/index.js";
import { startSecurityCleanupCron } from "./cron/securityCleanup.cron.js";

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = initSocket(server);
    global.io = io;

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startSecurityCleanupCron();
    });

  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
};

startServer();