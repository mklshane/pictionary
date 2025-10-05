import { useState, useEffect } from "react";
import socket from "../socket";

const AdminPage = () => {
  const [roomId, setRoomId] = useState("");
  const [maxDrawers, setMaxDrawers] = useState(1);
  const [created, setCreated] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const handleRoomCreated = ({ roomId }: { roomId: string }) => {
      setCreated(true);
      console.log("Room created:", roomId);
    };

    const handleStartRound = () => {
      setGameStarted(true);
      console.log("Game started!");
    };

    socket.on("room_created", handleRoomCreated);
    socket.on("start_round", handleStartRound);

    return () => {
      socket.off("room_created", handleRoomCreated);
      socket.off("start_round", handleStartRound);
    };
  }, []);

  const createRoom = () => {
    if (!roomId) {
      alert("Please enter a room ID");
      return;
    }
    console.log("Creating room:", roomId);
    socket.emit("create_room", { roomId, maxDrawers });
  };

  const startGame = () => {
    if (!roomId) {
      alert("No room ID specified");
      return;
    }
    console.log("Admin starting game for room:", roomId);
    socket.emit("start_game", { roomId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {!created ? (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Create a Room
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Drawers
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Number of drawers"
                  value={maxDrawers}
                  onChange={(e) => setMaxDrawers(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={createRoom}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Room
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Room Created!
              </h2>
              <p className="text-gray-600">
                Room ID:{" "}
                <span className="font-mono font-bold text-blue-600">
                  {roomId}
                </span>
              </p>
            </div>

            {!gameStarted ? (
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Start Game
                </button>
                <p className="text-sm text-gray-500">
                  Click Start Game to begin the first round
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold">
                  Game is now running! Players should see the drawing board.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
