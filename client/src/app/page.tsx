"use client";
import { Player } from "@/types/Player";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [currentPanel, setCurrentPanel] = useState<"home" | "game">("home");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>();

  const socketRef = useRef<Socket | null>(null);

  // useEffect(() => {
  //   const username = localStorage.getItem("username");
  //   if (username) {
  //     setUsername(username);
  //   }
  // }, []);

  const handleCreateGame = () => {
    if (username === "") return;

    // Connect to the server
    socketRef.current = io("http://localhost:4000");

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("createRoom", { username });
    });

    // Events
    socketRef.current.on("roomCreated", (data) => {
      setCurrentPanel("game");
      setJoinCode(data.code);
      setCurrentPlayer(data.player);
    });

    socketRef.current.on("updatePlayers", (data) => {
      setPlayers((prevPlayers) => [...data]);
    });

    socketRef.current.on("numberCalled", (data) => {});

    // 🔹 Automatically disconnect when page closes or reloads
    window.addEventListener("beforeunload", () => {
      socketRef.current?.disconnect();
    });
  };

  const handleJoinGame = () => {
    socketRef.current = io("http://localhost:4000");

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("joinRoom", { code: joinCode, username });
    });

    socketRef.current.on("joinedRoom", (data) => {
      setCurrentPanel("game");
      setJoinCode(data.code);
      setCurrentPlayer(data.player);
    });

    socketRef.current.on("updatePlayers", (data) => {
      setPlayers((prevPlayers) => [...data]);
    });

    // 🔹 Automatically disconnect when page closes or reloads
    window.addEventListener("beforeunload", () => {
      socketRef.current?.disconnect();
    });
  };

  const handlePlayerReady = () => {
    if (currentPlayer) {
      socketRef.current?.emit("playerReady", { code: joinCode });
      currentPlayer.ready = true;
    }
  };

  return (
    <>
      {currentPanel}
      {currentPanel === "home" ? (
        <div className="flex justify-center items-center h-screen">
          <div className="xl:w-1/3 md:w-1/2 mx-10 w-full border-white border rounded-md md:p-10 p-4">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                className="px-2 py-1 md:text-xl bg-transparent outline-none border-slate-800 border rounded-md"
                placeholder="Username"
                value={username}
                onChange={(evt) => {
                  setUsername(evt.target.value);
                }}
                maxLength={25}
              />

              <hr className="text-slate-600 mt-2 mb-4" />
              <button
                type="button"
                className="md:text-xl font-semibold bg-slate-800 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={username === ""}
                onClick={handleCreateGame}
              >
                CREATE GAME
              </button>

              <div className="w-full flex gap-2">
                <input
                  type="text"
                  className="w-full px-2 py-1 md:text-xl bg-transparent outline-none border-slate-800 border rounded-md"
                  placeholder="Join Code"
                  value={joinCode}
                  onChange={(evt) => {
                    setJoinCode(evt.target.value);
                  }}
                  maxLength={5}
                />

                <button
                  className="w-full md:text-xl font-semibold bg-slate-800 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                  disabled={
                    joinCode === "" || joinCode.length < 5 || username === ""
                  }
                  onClick={handleJoinGame}
                >
                  JOIN GAME
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-screen flex flex-col items-center p-10">
          <h1 className="text-3xl mb-5">
            Join Code: <span className="font-semibold">{joinCode}</span>
          </h1>

          <div className="w-full h-full flex gap-5">
            <div className="w-2/3 border border-white rounded-md p-5 flex flex-col">
              <div className="flex-1"></div>
              <div className="flex justify-center">
                {currentPlayer && !currentPlayer.ready ? (
                  <button
                    onClick={handlePlayerReady}
                    className="bg-green-800 hover:bg-green-700 cursor-pointer px-2 py-1 rounded-md font-semibold text-2xl"
                  >
                    Ready
                  </button>
                ) : (
                  <>
                    {currentPlayer?.owner && (
                      <button
                        onClick={handlePlayerReady}
                        className="bg-blue-600 hover:bg-blue-500 cursor-pointer px-2 py-1 rounded-md font-semibold text-2xl disabled:bg-gray-500 disabled:cursor-not-allowed"
                        disabled={!players.every((p) => p.ready)}
                      >
                        Start Game
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="w-1/3 border-white border rounded-md p-5">
              <p className="text-3xl font-semibold mb-5">
                Players: ({players.length})
              </p>
              <div className="flex flex-col">
                {players.map((player, index) => (
                  <span className="text-2xl" key={index}>
                    {player.username}{" "}
                    <span
                      className={`
                      font-bold
                      ${player.ready ? "text-green-500" : "text-yellow-500"}`}
                    >
                      ({player.ready ? "ready" : "waiting..."})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
