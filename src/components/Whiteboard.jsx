import React, { useRef, useEffect, useState } from "react";
import socket from "../socket";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000");

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
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

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setDrawing(true);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();

    // Send drawing data to server
    socket.emit("draw", { offsetX, offsetY, brushColor });
  };

  const stopDrawing = () => {
    setDrawing(false);
    ctxRef.current.closePath();
  };

  const drawOnCanvas = (data) => {
    const ctx = ctxRef.current;
    ctx.strokeStyle = data.brushColor;
    ctx.lineTo(data.offsetX, data.offsetY);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear_board");
  };

  return (
    <div className="flex flex-col items-center p-4">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onBlur={stopDrawing}
        className="border border-gray-400 bg-white"
      />
      <div className="mt-4 flex gap-4">
        {/* Brush Color Picker */}
        <input
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          className="border p-2"
        />
        <button
          onClick={clearCanvas}
          className="bg-red-500 text-white px-4 py-2"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;
