import { useRef, useEffect, useState } from "react";
import socket from "../socket";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000");
  const [isTextMode, setIsTextMode] = useState(false);
  const [text, setText] = useState("");
  const [texts, setTexts] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [dragging, setDragging] = useState(false);

  const lastPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    socket.on("load_whiteboard", (data) => {
      const drawings = [];
      const textItems = [];
      
      data.forEach((item) => {
        if (item.type === "draw") {
          drawings.push(item);
        } else if (item.type === "text") {
          textItems.push(item);
        }
      });
      setDrawingHistory(drawings);
      setTexts(textItems);
    })

    socket.on("update_whiteboard", (data) => {
      if (data.type === "draw") {
        setDrawingHistory(prev => [...prev, data]);
      } else if (data.type === "text") {
        setTexts(prev => [...prev, data]);
      }
    })

    socket.on("clear_board", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setTexts([]);
      setDrawingHistory([]);
    });

    return () => {
      socket.off("update_whiteboard");
      socket.off("clear_board");
      socket.off("load_whiteboard");
    };
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    if (isTextMode) return;
    if (nativeEvent.buttons !== 1) return; // Only start drawing with left mouse button
    const { offsetX, offsetY } = nativeEvent;
    setDrawing(true);
    ctxRef.current.beginPath();
    lastPositionRef.current = { x: offsetX, y: offsetY }
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing || isTextMode || nativeEvent.buttons !== 1) return; // Only draw if left button is held
    const { offsetX, offsetY } = nativeEvent;
    const { x: lastX, y: lastY } = lastPositionRef.current;

    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.moveTo(lastX, lastY); // Move to the last position
    ctxRef.current.lineTo(offsetX, offsetY); // Draw to the new position
    ctxRef.current.stroke();

    lastPositionRef.current = { x: offsetX, y: offsetY };

    const newDrawData = { type: "draw", offsetX, offsetY, lastX, lastY, brushColor };
    setDrawingHistory((prev) => [...prev, newDrawData]);
    socket.emit("draw", newDrawData)
  };

  const stopDrawing = () => {
    setDrawing(false);
    ctxRef.current.closePath();
  };

  const drawOnCanvas = () => {
    const ctx = ctxRef.current;

    drawingHistory.forEach((data) => {
      ctx.strokeStyle = data.brushColor;
      ctx.beginPath();
      ctx.moveTo(data.lastX, data.lastY);
      ctx.lineTo(data.offsetX, data.offsetY);
      ctx.stroke();
    });

    texts.forEach((data) => {
      ctx.fillStyle = data.brushColor;
      ctx.font = "16px Arial";
      ctx.fillText(data.text, data.x, data.y);
  });
}

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory([]);
    setTexts([]);
    socket.emit("clear_board");
  };

  const handleTextClick = ({ nativeEvent }) => {
    if (!isTextMode) return;
    const { offsetX, offsetY } = nativeEvent;

    const clickedIndex = texts.findIndex(
      (t) =>
        offsetX >= t.x &&
        offsetX <= t.x + t.width &&
        offsetY >= t.y - 16 &&
        offsetY <= t.y
    );

    if (clickedIndex !== -1) {
      setSelectedTextIndex(clickedIndex);
      setDragging(true);
    } else {
      const ctx = ctxRef.current;
      ctx.font = "16px Arial";
      const width = ctx.measureText(text).width;

      const newTextData = { text, x: offsetX, y: offsetY, width, brushColor };
      setTexts((prev) => [...prev, newTextData]);
      setText("");
      socket.emit("draw", { type: "text", ...newTextData });
    }
  };

  const handleMouseMove = ({ nativeEvent }) => {
    if (!dragging || selectedTextIndex === null) return;

    const { offsetX, offsetY } = nativeEvent;

    setTexts((prev) =>
      prev.map((t, index) =>
        index === selectedTextIndex ? { ...t, x: offsetX, y: offsetY } : t
      )
    );
  };

  const handleMouseUp = () => {
    if (dragging && selectedTextIndex !== null) {
      const updatedText = texts[selectedTextIndex];
      socket.emit("draw", { type: "text", ...updatedText });
    }
    setDragging(false);
    setSelectedTextIndex(null);
  };

  useEffect(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawOnCanvas();
  }, [drawingHistory, texts])

  return (
    <div className="flex flex-col items-center p-4">
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => (isTextMode ? handleTextClick(e) : startDrawing(e))}
        onMouseMove={(e) => (dragging ? handleMouseMove(e) : draw(e))}
        onMouseUp={handleMouseUp}
        onMouseOut={stopDrawing}
        className={`border border-gray-400 bg-white ${
          isTextMode ? "cursor-text" : "cursor-crosshair"
        }`}
      />
      <div className="mt-4 flex gap-4">
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
        <button
          onClick={() => setIsTextMode(!isTextMode)}
          className={`${
            isTextMode ? "bg-blue-500" : "bg-gray-500"
          } text-white px-4 py-2`}
        >
          {isTextMode ? "Drawing Mode" : "Text Mode"}
        </button>
        {isTextMode && (
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text"
              className="border p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
