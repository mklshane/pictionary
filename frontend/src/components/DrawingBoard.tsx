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
      context.strokeStyle = "black";
      setCtx(context);
    }

    const handleReceiveDrawing = (data: any) => {
      if (!ctx) return;

      if (data.type === "start") {
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
      } else if (data.type === "draw") {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
    };

    socket.on("receive_drawing", handleReceiveDrawing);

    return () => {
      socket.off("receive_drawing", handleReceiveDrawing);
    };
  }, [ctx]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawer || !ctx) return;
    setDrawing(true);

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);

    socket.emit("drawing_data", {
      roomId,
      data: { type: "start", x, y },
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !isDrawer || !ctx) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("drawing_data", {
      roomId,
      data: { type: "draw", x, y },
    });
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className={`w-full border-2 border-gray-300 rounded-lg shadow-md ${
          isDrawer
            ? "cursor-crosshair bg-white hover:shadow-lg transition-shadow duration-200"
            : "cursor-not-allowed bg-gray-50"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {!isDrawer && (
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-75 text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-semibold">
            You are a guesser - watch the drawing!
          </p>
        </div>
      )}
    </div>
  );
};

export default DrawingBoard;
