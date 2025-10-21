import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { Room } from "./types/Room";
import { generateJoinCode } from "./utils/generateJoinCode";
import { shuffleDeck } from "./utils/shuffleDeck";
import { Player } from "./types/Player";

const app = express();

app.use(cors());
app.get("/", (req: Request, res: Response) => res.send("Hello Lotería"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = new Map<string, Room>();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Create room
  socket.on("createRoom", ({ username }) => {
    const code = generateJoinCode(5, rooms);
    const newPlayer: Player = {
      id: socket.id,
      username,
      ready: false,
      owner: true,
    };

    const room: Room = {
      code,
      players: [newPlayer],
      numbersCalled: [],
      status: "waiting",
    };
    rooms.set(code, room);
    socket.join(code);
    socket.emit("roomCreated", { code, player: newPlayer });
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

    const newPlayer: Player = { id: socket.id, username, ready: false };
    room.players.push(newPlayer);
    socket.join(code);
    io.to(code).emit("joinedRoom", { code, player: newPlayer });
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

    // Start game automatically if all ready
    // if (room.players.every((p) => p.ready) && room.status === "waiting") {
    //   startGame(room);
    // }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const startGame = (room: Room) => {
  room.status = "in-progress";
  const deck = shuffleDeck();
  let index = 0;

  room.interval = setInterval(() => {
    if (index >= deck.length) {
      clearInterval(room.interval);
      room.status = "finished";
      io.to(room.code).emit("gameOver", { winner: null });
      return;
    }

    const number = deck[index++];
    room.numbersCalled.push(number);
    io.to(room.code).emit("numberCalled", number);
  }, 1000); // Sends a card every second
};

export { server };
