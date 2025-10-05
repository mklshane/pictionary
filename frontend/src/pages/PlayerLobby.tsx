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

  const joinRoom = () => {
    if (!name || !roomId) return;
    socket.emit("join_room", { roomId, name });
    setJoined(true);
  };

   useEffect(() => {
     socket.on("player_list", (players) => {
       setPlayers(players);
     });

     socket.on("start_round", () => {
       setGameStarted(true);
     });

     return () => {
       socket.off("player_list");
       socket.off("start_round");
     };
   }, []);

   if (gameStarted) {
     return <GameScreen roomId={roomId} name={name} />;
   }

  return (
    <div style={{ padding: "20px" }}>
      {!joined ? (
        <>
          <h2>Join Room</h2>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br />
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <br />
          <button onClick={joinRoom}>Join</button>
        </>
      ) : (
        <>
          <h2>Room: {roomId}</h2>
          <h3>Players:</h3>
          <ul>
            {players.map((p) => (
              <li key={p.socketId}>{p.name}</li>
            ))}
          </ul>
          <p>Waiting for the admin to start...</p>
        </>
      )}
    </div>
  );
};

export default PlayerLobby;
