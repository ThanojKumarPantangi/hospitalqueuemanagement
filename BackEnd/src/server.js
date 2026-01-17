import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.config.js";
import http from "http";
import { initSocket } from "./sockets/index.js";

dotenv.config({ path: "./src/.env"});
connectDB();

const server = http.createServer(app);

const io = initSocket(server);
global.io = io;



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});