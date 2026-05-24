import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import { setupStudyRoomSocket } from "./socket/studyRoomHandler.js";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupStudyRoomSocket(io);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`ScholarSpace API + WebSocket running on http://localhost:${PORT}`);
});
