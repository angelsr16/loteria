export interface Player {
  id: string; // socket.id
  username: string;
  ready: boolean;
  owner?: boolean;
}
