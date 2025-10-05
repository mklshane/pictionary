import { useState } from "react";
import socket from "../socket";

const AdminPage = () => {
  const [roomId, setRoomId] = useState("");
  const [maxDrawers, setMaxDrawers] = useState(1);
  const [created, setCreated] = useState(false);

  const createRoom = () => {
    if (!roomId) return;
    socket.emit("create_room", { roomId, maxDrawers });
  };

  socket.on("room_created", ({ roomId }) => {
    setCreated(true);
    console.log("Room created:", roomId);
  });

  const startGame = () => {
    socket.emit("start_game", { roomId });
  };

  return (
    <div style={{ padding: "20px" }}>
      {!created ? (
        <>
          <h2>Create a Room (Admin)</h2>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <br />
          <input
            type="number"
            min="1"
            placeholder="Max Drawers"
            value={maxDrawers}
            onChange={(e) => setMaxDrawers(Number(e.target.value))}
          />
          <br />
          <button onClick={createRoom}>Create Room</button>
        </>
      ) : (
        <>
          <h2>Room: {roomId} created!</h2>
          <button onClick={startGame}>Start Game</button>
        </>
      )}
    </div>
  );
};

export default AdminPage;
