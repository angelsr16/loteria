import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { Room } from "./types/Room";
import { generateJoinCode } from "./utils/generateJoinCode";
import { shuffleDeck } from "./utils/shuffleDeck";
import { Player } from "./types/Player";
import { generateBoard } from "./utils/generateBoard";

const app = express();

app.use(cors());
app.get("/", (req: Request, res: Response) => res.send("Hello Lotería"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://loteria-five-orpin.vercel.app", "http://localhost:3000"],
  },
});

const rooms = new Map<string, Room>();
const players = new Map<string, Player>();

io.on("connection", (socket) => {
  // console.log("New client connected:", socket.id);

  // Create room
  socket.on("createRoom", ({ username }) => {
    const code = generateJoinCode(5, rooms);
    const newPlayer: Player = {
      id: socket.id,
      username,
      ready: false,
      owner: true,
      room: code,
    };

    players.set(newPlayer.id, newPlayer);

    const room: Room = {
      code,
      players: [newPlayer],
      numbersCalled: [],
      status: "waiting",
    };
    rooms.set(code, room);
    socket.join(code);
    socket.emit("joinedRoom", { player: newPlayer });
    io.to(code).emit("updatePlayers", room.players);
    console.log(`Room created: ${code} by ${username}`);
  });

  // Join Room
  socket.on("joinRoom", ({ code, username }) => {
    const room = rooms.get(code);

    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    const newPlayer: Player = {
      id: socket.id,
      username,
      ready: false,
      room: code,
    };

    players.set(newPlayer.id, newPlayer);

    room.players.push(newPlayer);
    socket.join(code);
    socket.emit("joinedRoom", { player: newPlayer });
    io.to(code).emit("updatePlayers", room.players);
    console.log(`${username} joined room ${code}`);
  });

  // Player ready
  socket.on("playerReady", ({ code }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) player.ready = true;

    io.to(code).emit("updatePlayers", room.players);
    io.to(socket.id).emit("setBoard", generateBoard());
    if (room.players.every((p) => p.ready) && room.status === "waiting") {
      startGame(room);
    }
  });

  // Player claims Loteria
  socket.on("claimLoteria", ({ code, playerBoard }) => {
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const isBoardFull = playerBoard.every((cardNumber: number) =>
      room.numbersCalled.includes(cardNumber)
    );

    if (isBoardFull) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) player.winner = true;

      io.to(code).emit("updatePlayers", room.players);
      io.to(code).emit("gameOver");
      clearInterval(room.interval);
    }
  });

  socket.on("disconnect", () => {
    const player = players.get(socket.id);

    if (player) {
      const code = player.room;
      const room = rooms.get(code);
      if (room) {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id);

        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);

          io.to(code).emit("updatePlayers", room.players);

          if (room.players.length === 0) {
            clearInterval(room.interval);
            rooms.delete(code);
            console.log("Deleted empty room");
          }
        }
      }
    }
  });
});

const startGame = (room: Room) => {
  room.status = "in-progress";
  const deck = shuffleDeck();
  let index = 0;

  const number = deck[index++];
  room.numbersCalled.push(number);
  io.to(room.code).emit("gameStarted");
  io.to(room.code).emit("numberCalled", number);

  room.interval = setInterval(() => {
    if (index >= deck.length) {
      clearInterval(room.interval);
      room.status = "finished";
      return;
    }

    const number = deck[index++];
    room.numbersCalled.push(number);
    io.to(room.code).emit("numberCalled", number);
  }, 3700);
};

export { server };
