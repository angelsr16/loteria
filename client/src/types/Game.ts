import { Board } from "./Board";
import { Player } from "./Player";

export interface Game {
  players: Player[];
  cardsCalled: number[];
  currentCard: number;
  state: "no-game" | "waiting" | "in-progress" | "finished";
  board?: Board;
}
