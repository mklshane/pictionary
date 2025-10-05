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
  handleCorrectGuess,
  getPlayerRankings,
  clearRoomTimer,
  setRoomTimer,
  Player,
} from "./rooms.js";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const ROUND_DURATION = 30000; 

interface CreateRoomData {
  roomId: string;
  maxDrawers: number;
}

interface JoinRoomData {
  roomId: string;
  name: string;
}

interface StartGameData {
  roomId: string;
}

interface SelectWordData {
  roomId: string;
  word: string;
}

interface DrawingData {
  roomId: string;
  data: any;
}

interface MakeGuessData {
  roomId: string;
  guess: string;
  playerId: string;
}

interface EndRoundData {
  roomId: string;
}

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("create_room", (data: CreateRoomData) => {
    const { roomId, maxDrawers } = data;
    console.log(`Creating room: ${roomId} with ${maxDrawers} drawers`);
    createRoom(roomId, maxDrawers);
    socket.join(roomId);

    addPlayer(roomId, socket.id, "Admin", true);

    const room = getRoom(roomId);
    if (!room) return;

    const playersWithoutAdmin = room.players.filter(
      (player) => !player.isAdmin
    );
    io.to(socket.id).emit("room_created", { roomId });
    io.to(roomId).emit("player_list", playersWithoutAdmin);
    io.to(roomId).emit("score_update", getPlayerRankings(roomId));
  });

  socket.on("join_room", (data: JoinRoomData) => {
    const { roomId, name } = data;
    console.log(`Player ${name} joining room: ${roomId}`);
    const room = getRoom(roomId);
    if (!room) {
      io.to(socket.id).emit("error", { msg: "Room does not exist" });
      return;
    }
    addPlayer(roomId, socket.id, name, false);

    socket.join(roomId);

    const playersWithoutAdmin = room.players.filter(
      (player) => !player.isAdmin
    );
    io.to(roomId).emit("player_list", playersWithoutAdmin);
    io.to(roomId).emit("score_update", getPlayerRankings(roomId));
  });

  socket.on("start_game", (data: StartGameData) => {
    const { roomId } = data;
    console.log(`Start game requested for room: ${roomId}`);
    const room = getRoom(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return;
    }

    assignDrawers(roomId);
    room.gameStatus = "playing";

    const currentDrawer = getCurrentDrawer(roomId);
    console.log(`Current drawer assigned:`, currentDrawer);

    const playersWithoutAdmin = room.players.filter(
      (player) => !player.isAdmin
    );

    io.to(roomId).emit("drawers_assigned", {
      drawers: room.drawers,
      players: playersWithoutAdmin,
    });

    if (currentDrawer) {
      const wordOptions = [
        "apple",
        "car",
        "house",
        "tree",
        "sun",
        "cat",
        "dog",
        "ball",
      ];
      io.to(currentDrawer.socketId).emit("choose_word", {
        options: wordOptions,
      });

      io.to(roomId).emit("waiting_for_word", {
        drawer: currentDrawer,
      });
    } else {
      io.to(roomId).emit("game_over", {
        message: "No available drawer to start the game.",
      });
    }
  });

  socket.on("select_word", (data: SelectWordData) => {
    const { roomId, word } = data;
    console.log(`Word selected for room ${roomId}: ${word}`);
    const room = getRoom(roomId);
    if (!room) return;

    room.currentWord = word;
    const currentDrawer = getCurrentDrawer(roomId);
    if (!currentDrawer) return;

    setRoomTimer(
      roomId,
      () => {
        console.log(`Round timer ended for room: ${roomId}`);
        io.to(roomId).emit("round_time_up");
        endRound(roomId);
      },
      ROUND_DURATION
    );

    io.to(currentDrawer.socketId).emit("word_selected", { word });
    io.to(roomId).emit("start_round", { drawer: currentDrawer });
    io.to(roomId).emit("timer_start", { duration: ROUND_DURATION });
  });

  socket.on("drawing_data", (data: DrawingData) => {
    const { roomId, data: drawingData } = data;
    socket.to(roomId).emit("receive_drawing", drawingData);
  });

  socket.on("make_guess", (data: MakeGuessData) => {
    const { roomId, guess, playerId } = data;
    console.log(`Guess received in room ${roomId}: ${guess}`);
    const room = getRoom(roomId);
    if (!room) return;

    if (
      room.currentWord &&
      guess.toLowerCase() === room.currentWord.toLowerCase()
    ) {
      console.log(`Correct guess! ${guess} by player ${playerId}`);

      const { guesser, drawer } = handleCorrectGuess(roomId, playerId);

      io.to(roomId).emit("correct_guess", {
        playerId,
        guess,
        word: room.currentWord,
        guesserName: guesser?.name,
        drawerName: drawer?.name,
        points: 100,
      });

      io.to(roomId).emit("score_update", getPlayerRankings(roomId));

      // end round when someone guesses correctly
      clearRoomTimer(roomId);
      setTimeout(() => endRound(roomId), 2000); // short delay to show correct guess
    } else {
      io.to(roomId).emit("receive_guess", { guess, playerId });
    }
  });

  socket.on("end_round", (data: EndRoundData) => {
    const { roomId } = data;
    endRound(roomId);
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
    for (const [roomId] of Object.entries(io.sockets.adapter.rooms)) {
      removePlayer(roomId, socket.id);
    }
  });

  function endRound(roomId: string) {
    console.log(`Ending round for room: ${roomId}`);
    clearRoomTimer(roomId);

    const room = getRoom(roomId);
    if (!room) return;

    const hasNext = moveToNextDrawer(roomId);

    if (hasNext) {
      const nextDrawer = getCurrentDrawer(roomId);
      room.currentWord = undefined;

      if (nextDrawer) {
        const wordOptions = [
          "tree",
          "pizza",
          "dog",
          "mountain",
          "river",
          "computer",
        ];
        io.to(nextDrawer.socketId).emit("choose_word", {
          options: wordOptions,
        });
        io.to(roomId).emit("waiting_for_word", { drawer: nextDrawer });
      } else {
        endGame(roomId);
      }
    } else {
      endGame(roomId);
    }
  }

  function endGame(roomId: string) {
    const room = getRoom(roomId);
    if (!room) return;

    room.gameStatus = "finished";
    const finalRankings = getPlayerRankings(roomId);

    io.to(roomId).emit("game_over", {
      message: "Game finished!",
      finalRankings: finalRankings,
    });
  }
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
