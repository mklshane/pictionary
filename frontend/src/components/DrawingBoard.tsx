import { useRef, useState, useEffect } from "react";
import socket from "../socket";

type Props = {
  roomId: string;
  isDrawer: boolean;
};

const DrawingBoard = ({ roomId, isDrawer }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (context) {
      context.lineWidth = 3;
      context.lineCap = "round";
      setCtx(context);
    }

    // Receive drawing from others
    socket.on("receive_drawing", (data) => {
      if (!ctx) return;
      const { x, y } = data;
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    return () => {
      socket.off("receive_drawing");
    };
  }, [ctx]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawer || !ctx) return;
    setDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !isDrawer || !ctx) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("drawing_data", { roomId, data: { x, y } });
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      style={{
        border: "1px solid black",
        cursor: isDrawer ? "crosshair" : "not-allowed",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default DrawingBoard;
