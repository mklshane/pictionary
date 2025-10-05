export interface Player {
  socketId: string;
  name: string;
  score: number;
  isAdmin?: boolean;
}

export interface Room {
  players: Player[];
  drawers: Player[];
  maxDrawers: number;
  guesses: Record<string, any>;
  gameStatus: "waiting" | "playing" | "finished";
  currentDrawerIndex: number;
  currentWord?: string;
  timer?: NodeJS.Timeout;
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

export function addPlayer(
  roomId: string,
  socketId: string,
  name: string,
  isAdmin: boolean = false
) {
  const room = rooms[roomId];
  if (!room) return;

  const existingPlayerIndex = room.players.findIndex(
    (p) => p.socketId === socketId
  );
  if (existingPlayerIndex !== -1) {
    room.players[existingPlayerIndex] = { socketId, name, score: 0, isAdmin };
  } else {
    room.players.push({ socketId, name, score: 0, isAdmin });
  }
}

export function assignDrawers(roomId: string) {
  const room = rooms[roomId];
  if (!room) return;

  const eligiblePlayers = room.players.filter((player) => !player.isAdmin);
  const shuffled = [...eligiblePlayers].sort(() => 0.5 - Math.random());
  room.drawers = shuffled.slice(0, room.maxDrawers);
  room.currentDrawerIndex = 0;
}

export function getCurrentDrawer(roomId: string): Player | null {
  const room = rooms[roomId];
  if (!room) return null;
  return room.drawers[room.currentDrawerIndex] || null;
}

export function moveToNextDrawer(roomId: string): boolean {
  const room = rooms[roomId];
  if (!room) return false;
  room.currentDrawerIndex++;
  return room.currentDrawerIndex < room.drawers.length;
}

export function getRoom(roomId: string): Room | undefined {
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

export function handleCorrectGuess(
  roomId: string,
  guesserId: string
): { guesser: Player | null; drawer: Player | null } {
  const room = rooms[roomId];
  if (!room) return { guesser: null, drawer: null };

  const guesser = room.players.find((p) => p.socketId === guesserId);
  const drawer = getCurrentDrawer(roomId);

  if (guesser) {
    guesser.score += 100; 
  }

  if (drawer) {
    const drawerPlayer = room.players.find(
      (p) => p.socketId === drawer.socketId
    );
    if (drawerPlayer) {
      drawerPlayer.score += 50; 
    }
  }

  return { guesser: guesser || null, drawer };
}

export function getPlayerRankings(roomId: string): Player[] {
  const room = rooms[roomId];
  if (!room) return [];

  return [...room.players]
    .filter((player) => !player.isAdmin) 
    .sort((a, b) => b.score - a.score);
}

export function clearRoomTimer(roomId: string) {
  const room = rooms[roomId];
  if (!room || !room.timer) return;

  clearTimeout(room.timer);
  room.timer = undefined;
}

export function setRoomTimer(
  roomId: string,
  callback: () => void,
  duration: number
) {
  const room = rooms[roomId];
  if (!room) return;

  clearRoomTimer(roomId);
  room.timer = setTimeout(callback, duration);
}
