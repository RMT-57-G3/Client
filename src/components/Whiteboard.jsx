import React, {useRef, useEffect, useState, useContext} from "react";
import socket from "../socket.js";
import {MoonIcon, SunIcon} from "@heroicons/react/16/solid/index.js";
import {WhiteboardContext} from "./WhiteBoardContext.jsx";
import Button from "./sub/button.jsx";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const {brushColor, setBrushColor, darkMode, setDarkMode, isEraser, setIsEraser} = useContext(WhiteboardContext);
  const [drawing, setDrawing] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [text, setText] = useState("");
  const [texts, setTexts] = useState([]);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [dragging, setDragging] = useState(false);

  const lastPositionRef = useRef({x: 0, y: 0});
  const [currentShape, setCurrentShape] = useState(null); // Track the shape being drawn
  const [startPoint, setStartPoint] = useState(null); // Track where the shape starts
  const [shapes, setShapes] = useState([]); // Store all the drawn shapes

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 5000;
    canvas.height = 5000;
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

  // Start drawing function for freehand or shapes
  const startDrawing = ({nativeEvent}) => {
    if (isTextMode) return;
    if (nativeEvent.buttons !== 1) return; // Only start drawing with left mouse button
    const {offsetX, offsetY} = nativeEvent;
    setDrawing(true);
    if (currentShape) {
      setStartPoint({x: offsetX, y: offsetY}); // Start point for shapes
    } else {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
      // Store the starting point
      ctxRef.current.startX = offsetX;
      ctxRef.current.startY = offsetY;
    }
    socket.emit("draw_start", {startX: offsetX, startY: offsetY, brushColor});
    lastPositionRef.current = {x: offsetX, y: offsetY}
  };

  // Draw function for both freehand and shapes
  const draw = ({nativeEvent}) => {
    if (!drawing || isTextMode || nativeEvent.buttons !== 1) return; // Only draw if left button is held
    const {offsetX, offsetY} = nativeEvent;
    const {x: lastX, y: lastY} = lastPositionRef.current;

    if (currentShape && startPoint) {
      // Drawing shapes: rectangle or circle
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (currentShape === "rectangle") {
        const width = offsetX - startPoint.x;
        const height = offsetY - startPoint.y;
        ctx.strokeStyle = brushColor;
        ctx.strokeRect(startPoint.x, startPoint.y, width, height);
      } else if (currentShape === "circle") {
        const radius = Math.sqrt(
          Math.pow(offsetX - startPoint.x, 2) +
          Math.pow(offsetY - startPoint.y, 2)
        );
        ctx.strokeStyle = brushColor;
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else {
      ctxRef.current.strokeStyle = brushColor;
      ctxRef.current.moveTo(lastX, lastY); // Move to the last position
      ctxRef.current.lineTo(offsetX, offsetY); // Draw to the new position
      ctxRef.current.stroke();

      lastPositionRef.current = {x: offsetX, y: offsetY};

      const newDrawData = {type: "draw", offsetX, offsetY, lastX, lastY, brushColor};
      setDrawingHistory((prev) => [...prev, newDrawData]);
      socket.emit("draw", newDrawData)
      // Update the starting point for the next segment
      ctxRef.current.startX = offsetX;
      ctxRef.current.startY = offsetY;
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
    if (!currentShape) {
      ctxRef.current.closePath();
    }
  };

  const drawOnCanvas = () => {
    const ctx = ctxRef.current;
    ctx.strokeStyle = data.brushColor;

    if (data.type) {
      // Shape drawing
      if (data.type === "rectangle") {
        ctx.strokeRect(data.startX, data.startY, data.width, data.height);
      } else if (data.type === "circle") {
        ctx.beginPath();
        ctx.arc(data.startX, data.startY, data.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else {
      drawingHistory.forEach((data) => {
        ctx.strokeStyle = data.brushColor;
        ctx.beginPath();
        ctx.moveTo(data.lastX, data.lastY);
        ctx.lineTo(data.offsetX, data.offsetY);
        ctx.stroke();
        ctx.closePath();
      });

      texts.forEach((data) => {
        ctx.fillStyle = data.brushColor;
        ctx.font = "16px Arial";
        ctx.fillText(data.text, data.x, data.y);
        ctx.closePath();
      });
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory([]);
    setTexts([]);
    socket.emit("clear_board");
  };

  // Handle shape selection
  const handleShapeSelection = (shape) => {
    setCurrentShape(shape);
    setStartPoint(null); // Reset the start point
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
    <div className="flex flex-col items-center">
      <div className="relative w-full h-screen border border-gray-400 rounded-md">
        <div className="relative w-full h-screen overflow-x-scroll overflow-y-scroll">
          <canvas
            ref={canvasRef}
            onMouseDown={(e) => (isTextMode ? handleTextClick(e) : startDrawing(e))}
            onMouseMove={(e) => (dragging ? handleMouseMove(e) : draw(e))}
            onMouseUp={handleMouseUp}
            onMouseOut={stopDrawing}
            className={`bg-white dark:bg-neutral-900 ${
              isTextMode ? "cursor-text" : "cursor-crosshair"
            }`}
            width={window.innerWidth}
            height={window.innerHeight}
          />
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center mt-4">
          <div className="flex gap-4 items-center bg-black/50 rounded-xl px-4 py-2 backdrop-blur-xl">
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="border p-2"
              />
              <Button onClick={clearCanvas} className="bg-red-500 hover:bg-red-700">
                Clear
              </Button>
              <Button onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Light Mode" : "Dark Mode"} className="bg-neutral-500 hover:bg-neutral-700">
                {darkMode ? <SunIcon className="w-4 h-6"/> : <MoonIcon className="w-4 h-6"/>}
              </Button>
              <Button
                onClick={() => handleShapeSelection("rectangle")}
                className="bg-blue-500 hover:bg-blue-700 text-white"
              >
                Rectangle
              </Button>
              <Button
                onClick={() => handleShapeSelection("circle")}
                className="bg-green-500 hover:bg-green-700 text-white"
              >
                Circle
              </Button>
              <Button
                onClick={() => handleShapeSelection(null)} // Freehand drawing
                className="bg-gray-500 hover:bg-gray-700 text-white"
              >
                Freehand
              </Button>
              <Button
                onClick={() => setIsTextMode(!isTextMode)}
                className={`${
                  isTextMode ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-500 hover:bg-gray-700"
                } text-white`}
              >
                {isTextMode ? "Drawing Mode" : "Text Mode"}
              </Button>
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
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
