export interface Player {
  id: string; // socket.id
  username: string;
  ready: boolean;
  room: string;
  winner?: boolean;
  owner?: boolean;
}
