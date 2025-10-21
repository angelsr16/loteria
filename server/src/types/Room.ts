import { Player } from "./Player";

export interface Room {
  code: string;
  players: Player[];
  numbersCalled: number[];
  status: "waiting" | "in-progress" | "finished";
  interval?: NodeJS.Timeout;
}
