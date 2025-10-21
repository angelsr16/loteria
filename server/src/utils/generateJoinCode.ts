import { Room } from "../types/Room";

export const generateJoinCode = (length: number, rooms: Map<string, Room>) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  do {
    code = Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
};
