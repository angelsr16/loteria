"use client";
import { Board } from "@/types/Board";
import { Game } from "@/types/Game";
import { Player } from "@/types/Player";
import { Cards } from "@/utils/cards";
import { Card } from "@/types/Board";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [displayHUD, setDisplayHUD] = useState(true);
  const [isBoardFull, setIsBoardFull] = useState(false);

  const [game, setGame] = useState<Game>({
    players: [],
    cardsCalled: [],
    currentCard: -1,
    state: "no-game" as "no-game" | "waiting" | "in-progress" | "finished",
  });

  const [player, setPlayer] = useState<Player>({
    id: "",
    username: "",
    room: "",
    ready: false,
  });

  useEffect(() => {
    if (!game.board) return;

    const isBoardFull = game.board.cards.every((card) => card.isMarked);
    setIsBoardFull(isBoardFull);
  }, [game.board]);

  const socketRef = useRef<Socket | null>(null);

  const connectSocket = useCallback((onConnect?: (socket: any) => void) => {
    if (socketRef.current) return socketRef.current;

    const socket = io(process.env.NEXT_PUBLIC_SERVER_URL);

    if (onConnect) {
      socket.on("connect", () => {
        onConnect(socket);
      });
    }

    socketRef.current = socket;
    return socket;
  }, []);

  const bindSocketEvents = useCallback(() => {
    const socket = connectSocket();
    if (!socket) return;

    setGame((prev) => ({ ...prev, state: "waiting" }));

    socket.on("joinedRoom", (data) => {
      setPlayer(data.player);
    });

    socket.on("setBoard", (data) => {
      setGame((prev) => ({
        ...prev,
        board: data,
      }));
    });

    socket.on("gameStarted", (data) => {
      setGame((prev) => ({
        ...prev,
        state: "in-progress",
      }));
    });

    socket.on("gameOver", () => {
      setGame((prev) => ({
        ...prev,
        state: "finished",
      }));
    });

    socket.on("updatePlayers", (data: Player[]) => {
      setGame((prev) => ({ ...prev, players: [...data] }));
    });

    socket.on("numberCalled", (data) => {
      setGame((prev) => ({
        ...prev,
        currentCard: data,
        cardsCalled: [...prev.cardsCalled, data],
      }));
    });
  }, []);

  const handleCreateGame = () => {
    if (player.username === "") return;

    connectSocket((socket) => {
      socket.emit("createRoom", { username: player.username });
    });

    bindSocketEvents();
  };

  const handleJoinGame = () => {
    if (player.username === "" || player.room === "") return;

    connectSocket((socket) => {
      socket.emit("joinRoom", { code: player.room, username: player.username });
    });

    bindSocketEvents();
  };

  const handlePlayerReady = () => {
    if (player) {
      const socket = connectSocket();
      socket.emit("playerReady", { code: player.room });
      player.ready = true;
    }
  };

  const handleClaimLoteria = () => {
    if (player && game.board) {
      const socket = connectSocket();

      const playerBoard = game.board.cards.map((card) => card.number);

      socket.emit("claimLoteria", {
        code: player.room,
        playerBoard,
      });
    }
  };

  const handleMarkCard = (cardIndex: number) => {
    if (!game.board) return;

    const card = game.board.cards[cardIndex];

    if (game.cardsCalled.includes(card.number)) {
      setGame((prev) => ({
        ...prev,
        board: {
          ...prev.board,
          cards: (prev.board ? prev.board.cards : []).map((card, index) =>
            index === cardIndex ? { ...card, isMarked: true } : card
          ),
        },
      }));
    }
  };

  return (
    <>
      {game.state === "no-game" ? (
        <div className="flex justify-center items-center h-screen">
          <div className="xl:w-1/3 md:w-1/2 mx-10 w-full border-slate-600 border rounded-md md:p-10 p-4">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                className="px-2 py-1 md:text-xl bg-transparent outline-none border-slate-800 border rounded-md"
                placeholder="Username"
                value={player.username}
                onChange={(evt) => {
                  setPlayer((prev) => ({
                    ...prev,
                    username: evt.target.value,
                  }));
                }}
                maxLength={25}
              />

              <hr className="text-slate-600 mt-2 mb-4" />
              <button
                type="button"
                className="md:text-xl font-semibold bg-slate-800 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={player.username === ""}
                onClick={handleCreateGame}
              >
                CREATE GAME
              </button>

              <div className="w-full flex gap-2">
                <input
                  type="text"
                  className="w-full px-2 py-1 md:text-xl bg-transparent outline-none border-slate-800 border rounded-md"
                  placeholder="Join Code"
                  value={player.room}
                  onChange={(evt) => {
                    setPlayer((prev) => ({ ...prev, room: evt.target.value }));
                  }}
                  maxLength={5}
                />

                <button
                  className="w-full md:text-xl font-semibold bg-slate-800 rounded-md px-2 py-1 cursor-pointer hover:bg-slate-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
                  disabled={
                    player.room === "" ||
                    player.room.length < 5 ||
                    player.username === ""
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
        <div className="w-full h-screen flex flex-col items-center md:p-10 p-5">
          {game.state === "waiting" && (
            <h1 className="text-3xl mb-5">
              Room Code: <span className="font-semibold">{player.room}</span>
            </h1>
          )}

          <div className="w-2/3 h-full flex-1 flex lg:gap-5 ">
            {/* --- BOARD SECTION --- */}

            <div className="w-full flex lg:flex-row flex-col lg:gap-10 gap-5">
              <div className="w-full h-full flex justify-center items-center">
                {game.board && (
                  <div className="relative grid grid-cols-4 grid-rows-4 gap-1 bg-white xl:w-2/3 w-full h-full">
                    {game.board.cards.map((card, index) => (
                      <div
                        key={index}
                        className="w-full h-full relative bg-blue-500 border border-black cursor-pointer"
                        onClick={() => {
                          if (!card.isMarked && game.state === "in-progress") {
                            handleMarkCard(index);
                          }
                        }}
                      >
                        <img
                          draggable={false}
                          className="w-full h-full bg-white"
                          src={Cards[card.number - 1].image}
                          alt={Cards[card.number - 1].title}
                        />
                        {card.isMarked && (
                          <span className="absolute w-full h-full bg-black/70 top-0 flex justify-center items-center text-red-500 md:text-8xl text-4xl">
                            X
                          </span>
                        )}
                      </div>
                    ))}

                    {isBoardFull && (
                      <div
                        onClick={handleClaimLoteria}
                        className="absolute top-0 left-0 w-full h-full bg-black/30 flex justify-center items-center"
                      >
                        <button
                          disabled={game.state !== "in-progress"}
                          className="disabled:bg-gray-500 text-3xl font-bold bg-green-700 hover:bg-green-600 px-3 py-2 rounded-md cursor-pointer"
                        >
                          LOTERIA
                        </button>
                      </div>
                    )}

                    {game.state === "finished" && (
                      <div className="absolute top-0 left-0 w-full h-full bg-black/30 text-4xl font-bold flex flex-col justify-center items-center">
                        <span className="text-5xl font-bold text-shadow-black text-shadow-lg">
                          GAME OVER
                        </span>

                        <button
                          onClick={() => {
                            window.location.reload();
                          }}
                          className="bg-gray-700 text-3xl font-bold  hover:bg-gray-600 px-3 py-2 rounded-md cursor-pointer"
                        >
                          EXIT
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-full flex lg:flex-col flex-row gap-5 justify-center items-center">
                {game.cardsCalled.length > 1 && (
                  <div className="flex flex-col items-center rounded-md border border-slate-500 md:px-8 md:py-5 px-3 py-1">
                    <>
                      <span className="font-semibold md:text-2xl text-lg text-center">
                        Anterior
                      </span>
                      <div className="md:w-32 w-20">
                        <img
                          className="w-full p-1 bg-white"
                          src={`${
                            Cards[
                              game.cardsCalled[game.cardsCalled.length - 2] - 1
                            ].image
                          }`}
                          alt="card"
                        />
                      </div>
                    </>
                  </div>
                )}

                {game.currentCard !== -1 && (
                  <div className="flex flex-col items-center rounded-md border border-slate-500 md:px-8 md:py-5 px-3 py-1">
                    <>
                      <span className="font-semibold md:text-2xl text-lg text-center">
                        Actual
                      </span>
                      <div className="md:w-32 w-20">
                        <img
                          className="w-full p-1 bg-white"
                          src={`${Cards[game.currentCard - 1].image}`}
                          alt="card"
                        />
                      </div>
                    </>
                  </div>
                )}
              </div>
            </div>
          </div>

          {game.state === "waiting" && (
            <div className="flex justify-center">
              {player && !player.ready && (
                <button
                  onClick={handlePlayerReady}
                  className="bg-green-800 hover:bg-green-700 cursor-pointer px-2 py-1 rounded-md font-semibold text-2xl"
                >
                  Ready
                </button>
              )}
            </div>
          )}

          <div
            className={`fixed z-100 bottom-5 right-5 bg-white/10 rounded-md p-2 ${
              displayHUD && "min-h-64 min-w-72"
            }`}
          >
            <div className="flex justify-between items-end gap-5">
              <div className="flex gap-1">
                <span className="text-sm cursor-pointer px-2 py-1 bg-slate-900 hover:bg-slate-700 rounded-md font-semibold">
                  Players ({game.players.length})
                </span>
                {/* <span className="text-sm cursor-pointer px-2 py-1 bg-slate-900 hover:bg-slate-700 rounded-md font-semibold">
                  Chat
                </span> */}
              </div>

              <div>
                <span
                  onClick={() => setDisplayHUD(!displayHUD)}
                  className="text-xs text-blue-500 cursor-pointer"
                >
                  {!displayHUD ? "Show" : "Hide"}
                </span>
              </div>
            </div>
            {displayHUD && (
              <div className="grid grid-rows-2 p-2">
                {game.players.map((player, index) => (
                  <span
                    className="text-sm font-bold cursor-pointer"
                    key={index}
                  >
                    <span className="underline">{player.username}</span>{" "}
                    {game.state === "waiting" && (
                      <span
                        className={`
                      font-bold
                      ${player.ready ? "text-green-500" : "text-yellow-500"}`}
                      >
                        {player.ready ? "(ready)" : "(waiting...)"}
                      </span>
                    )}
                    {game.state === "finished" && (
                      <span
                        className={`
                          
                          font-bold
                      ${player.winner && "text-green-500"}`}
                      >
                        {player.winner && "(WINNER)"}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
