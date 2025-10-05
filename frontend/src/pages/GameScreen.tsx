import { useEffect, useState } from "react";
import socket from "../socket";
import DrawingBoard from "../components/DrawingBoard";

type Player = { socketId: string; name: string };

const GameScreen = ({ roomId, name }: { roomId: string; name: string }) => {
  const [drawer, setDrawer] = useState<Player | null>(null);

  useEffect(() => {
    socket.on("start_round", ({ drawer }) => {
      setDrawer(drawer);
    });

    return () => {
      socket.off("start_round");
    };
  }, []);

  const isDrawer = drawer?.socketId === socket.id;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Room: {roomId}</h2>
      {drawer && <h3>Current Drawer: {drawer.name}</h3>}

      <DrawingBoard roomId={roomId} isDrawer={isDrawer || false} />
    </div>
  );
};

export default GameScreen;
