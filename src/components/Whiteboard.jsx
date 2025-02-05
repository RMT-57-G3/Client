import React, {useRef, useEffect, useState} from "react";
import socket from "../socket.js";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 5000;
    canvas.height = 5000;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    // Load existing whiteboard data when connecting
    socket.on("load_whiteboard", (data) => {
      data.forEach(drawOnCanvas);
    });

    // Real-time update when others draw
    socket.on("update_whiteboard", (data) => {
      drawOnCanvas(data);
    });

    // Clear whiteboard when reset
    socket.on("clear_board", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("update_whiteboard");
      socket.off("clear_board");
      socket.off("load_whiteboard");
    };
  }, []);

  const startDrawing = ({nativeEvent}) => {
    const {offsetX, offsetY} = nativeEvent;
    setDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    // Store the starting point
    ctxRef.current.startX = offsetX;
    ctxRef.current.startY = offsetY;
    socket.emit("draw_start", {startX: offsetX, startY: offsetY, brushColor});
  };

  const draw = ({nativeEvent}) => {
    if (!drawing) return;
    const {offsetX, offsetY} = nativeEvent;
    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();

    // Send drawing data to server with starting point
    socket.emit("draw", {startX: ctxRef.current.startX, startY: ctxRef.current.startY, offsetX, offsetY, brushColor});
    // Update the starting point for the next segment
    ctxRef.current.startX = offsetX;
    ctxRef.current.startY = offsetY;
  };

  const stopDrawing = () => {
    setDrawing(false);
    ctxRef.current.closePath();
  };

  const drawOnCanvas = (data) => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(data.startX, data.startY);
    ctx.strokeStyle = data.brushColor;
    ctx.lineTo(data.offsetX, data.offsetY);
    ctx.stroke();
    ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear_board");
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-screen border border-gray-400 rounded-md">
        <div className="relative w-full h-screen overflow-x-scroll overflow-y-scroll">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            className="bg-white"
            width={window.innerWidth}
            height={window.innerHeight}
          />
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center mt-4">
          <div className="flex gap-4 items-center bg-black/50 rounded-xl px-4 py-2 backdrop-blur-xl">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="border p-2"
            />
            <button
              onClick={clearCanvas}
              className="bg-red-500 text-white px-4 py-2 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;