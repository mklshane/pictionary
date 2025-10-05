import { useState, useEffect } from "react";
import socket from "../socket";
import GameScreen from "./GameScreen";

const PlayerLobby = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<{ name: string; socketId: string }[]>(
    []
  );

  useEffect(() => {
    const handlePlayerList = (
      players: { name: string; socketId: string }[]
    ) => {
      console.log("Player list updated:", players);
      setPlayers(players);
    };

    const handleStartRound = () => {
      console.log("Game starting, moving to game screen");
      setGameStarted(true);
    };

    const handleWaitingForWord = () => {
      console.log("Waiting for drawer to choose word");
      setGameStarted(true);
    };

    socket.on("player_list", handlePlayerList);
    socket.on("start_round", handleStartRound);
    socket.on("waiting_for_word", handleWaitingForWord);

    return () => {
      socket.off("player_list", handlePlayerList);
      socket.off("start_round", handleStartRound);
      socket.off("waiting_for_word", handleWaitingForWord);
    };
  }, []);

  const joinRoom = () => {
    if (!name || !roomId) {
      alert("Please enter both name and room ID");
      return;
    }
    console.log("Joining room:", roomId, "as", name);
    socket.emit("join_room", { roomId, name });
    setJoined(true);
  };

  const debugStartGame = () => {
    console.log("Debug: Starting game from player lobby");
    socket.emit("start_game", { roomId });
  };

  if (gameStarted) {
    return <GameScreen roomId={roomId} name={name} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {!joined ? (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Join Room
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={joinRoom}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Join Room
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Room: <span className="text-purple-600">{roomId}</span>
              </h2>
              <p className="text-gray-600">Waiting for the admin to start...</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Players ({players.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {players.map((p) => (
                    <li
                      key={p.socketId}
                      className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm"
                    >
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{p.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={debugStartGame}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm opacity-75 hover:opacity-100"
            >
              Debug: Start Game
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerLobby;
