export interface Player {
  id: string; // socket.id
  username: string;
  ready: boolean;
  room: string;
  owner?: boolean;
}
