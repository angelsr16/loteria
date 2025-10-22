import { Board, Card } from "../types/Board";

export const generateBoard = (): Board => {
  const numbers = new Set<number>();

  while (numbers.size < 16) {
    numbers.add(Math.floor(Math.random() * 54) + 1);
  }

  const cards: Card[] = Array.from(numbers).map((number) => ({
    number,
    isMarked: false,
  }));

  return { cards };
};
