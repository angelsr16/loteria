export interface Board {
  cards: Card[];
}

export interface Card {
  number: number;
  isMarked: boolean;
}
