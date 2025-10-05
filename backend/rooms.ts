// src/rooms.ts
export interface Player {
  socketId: string;
  name: string;
  score: number;
}

export interface Room {
  players: Player[];
  drawers: Player[];
  maxDrawers: number;
  guesses: Record<string, any>;
  gameStatus: "waiting" | "playing";
  currentDrawerIndex: number;
}

export const rooms: Record<string, Room> = {};

export function createRoom(roomId: string, maxDrawers: number) {
  rooms[roomId] = {
    players: [],
    drawers: [],
    maxDrawers,
    guesses: {},
    gameStatus: "waiting",
    currentDrawerIndex: 0,
  };
}

export function addPlayer(roomId: string, socketId: string, name: string) {
  const room = rooms[roomId];
  if (!room) return;
  room.players.push({ socketId, name, score: 0 });
}

export function assignDrawers(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;
  const shuffled = [...room.players].sort(() => 0.5 - Math.random());
  room.drawers = shuffled.slice(0, room.maxDrawers);
  room.currentDrawerIndex = 0;
}

export function getCurrentDrawer(roomId: string) {
  const room = rooms[roomId];
  if (!room) return null;
  return room.drawers[room.currentDrawerIndex];
}

export function moveToNextDrawer(roomId: string) {
  const room = rooms[roomId];
  if (!room) return false;
  room.currentDrawerIndex++;
  return room.currentDrawerIndex < room.drawers.length;
}

export function getRoom(roomId: string) {
  return rooms[roomId];
}

export function removePlayer(roomId: string, socketId: string) {
  const room = rooms[roomId];
  if (!room) return;
  room.players = room.players.filter((p) => p.socketId !== socketId);
  room.drawers = room.drawers.filter((p) => p.socketId !== socketId);
  if (room.players.length === 0) {
    delete rooms[roomId];
  }
}
