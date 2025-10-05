import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import {
  createRoom,
  addPlayer,
  assignDrawers,
  getRoom,
  getCurrentDrawer,
  moveToNextDrawer,
  removePlayer,
} from "./rooms.js";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("create_room", ({ roomId, maxDrawers }) => {
    createRoom(roomId, maxDrawers);
    socket.join(roomId);
    io.to(socket.id).emit("room_created", { roomId });
  });

  socket.on("join_room", ({ roomId, name }) => {
    const room = getRoom(roomId);
    if (!room) {
      io.to(socket.id).emit("error", { msg: "Room does not exist" });
      return;
    }
    addPlayer(roomId, socket.id, name);
    socket.join(roomId);
    io.to(roomId).emit("player_list", room.players);
  });

  socket.on("start_game", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;

    assignDrawers(roomId);
    room.gameStatus = "playing";

    const currentDrawer = getCurrentDrawer(roomId);

    io.to(roomId).emit("drawers_assigned", {
      drawers: room.drawers,
      players: room.players,
    });

    io.to(roomId).emit("start_round", {
      drawer: currentDrawer,
    });
  });

  socket.on("drawing_data", ({ roomId, data }) => {
    socket.to(roomId).emit("receive_drawing", data);
  });

  socket.on("make_guess", ({ roomId, guess, playerId }) => {
    io.to(roomId).emit("receive_guess", { guess, playerId });
  });

  socket.on("end_round", ({ roomId }) => {
    const hasNext = moveToNextDrawer(roomId);
    const room = getRoom(roomId);
    if (!room) return;

    if (hasNext) {
      const nextDrawer = getCurrentDrawer(roomId);
      io.to(roomId).emit("start_round", { drawer: nextDrawer });
    } else {
      io.to(roomId).emit("game_over", {
        message: "All drawers have finished!",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    for (const [roomId] of Object.entries(io.sockets.adapter.rooms)) {
      removePlayer(roomId, socket.id);
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
