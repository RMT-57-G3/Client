// import React, { useRef, useEffect, useState } from "react";
// import socket from "../socket.js";

// const Whiteboard = () => {
//   const canvasRef = useRef(null);
//   const ctxRef = useRef(null);
//   const [drawing, setDrawing] = useState(false);
//   const [brushColor, setBrushColor] = useState("#000");

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     canvas.width = window.innerWidth * 0.8;
//     canvas.height = window.innerHeight * 0.8;
//     const ctx = canvas.getContext("2d");
//     ctx.lineCap = "round";
//     ctx.lineJoin = "round";
//     ctx.lineWidth = 3;
//     ctxRef.current = ctx;

//     // Load existing whiteboard data when connecting
//     socket.on("load_whiteboard", (data) => {
//       data.forEach(drawOnCanvas);
//     });

//     // Real-time update when others draw
//     socket.on("update_whiteboard", (data) => {
//       drawOnCanvas(data);
//     });

//     // Clear whiteboard when reset
//     socket.on("clear_board", () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//     });

//     return () => {
//       socket.off("update_whiteboard");
//       socket.off("clear_board");
//       socket.off("load_whiteboard");
//     };
//   }, []);

//   const startDrawing = ({ nativeEvent }) => {
//     const { offsetX, offsetY } = nativeEvent;
//     setDrawing(true);
//     ctxRef.current.beginPath();
//     ctxRef.current.moveTo(offsetX, offsetY);
//     // Store the starting point
//     ctxRef.current.startX = offsetX;
//     ctxRef.current.startY = offsetY;
//     socket.emit("draw_start", { startX: offsetX, startY: offsetY, brushColor });
//   };

//   const draw = ({ nativeEvent }) => {
//     if (!drawing) return;
//     const { offsetX, offsetY } = nativeEvent;
//     ctxRef.current.strokeStyle = brushColor;
//     ctxRef.current.lineTo(offsetX, offsetY);
//     ctxRef.current.stroke();

//     // Send drawing data to server with starting point
//     socket.emit("draw", { startX: ctxRef.current.startX, startY: ctxRef.current.startY, offsetX, offsetY, brushColor });
//     // Update the starting point for the next segment
//     ctxRef.current.startX = offsetX;
//     ctxRef.current.startY = offsetY;
//   };

//   const stopDrawing = () => {
//     setDrawing(false);
//     ctxRef.current.closePath();
//   };

//   const drawOnCanvas = (data) => {
//     const ctx = ctxRef.current;
//     ctx.beginPath();
//     ctx.moveTo(data.startX, data.startY);
//     ctx.strokeStyle = data.brushColor;
//     ctx.lineTo(data.offsetX, data.offsetY);
//     ctx.stroke();
//     ctx.closePath();
//   };

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
//     socket.emit("clear_board");
//   };

//   return (
//     <div className="flex flex-col items-center">
//       <div className="relative w-full h-screen border border-gray-400 rounded-md">
//         <div className="relative w-full h-screen overflow-x-scroll overflow-y-scroll">
//           <canvas
//             ref={canvasRef}
//             onMouseDown={startDrawing}
//             onMouseMove={draw}
//             onMouseUp={stopDrawing}
//             onMouseOut={stopDrawing}
//             className="bg-white"
//             width={window.innerWidth}
//             height={window.innerHeight}
//           />
//         </div>
//         <div className="absolute top-0 left-auto mx-auto mt-4 flex gap-4">
//           <input
//             type="color"
//             value={brushColor}
//             onChange={(e) => setBrushColor(e.target.value)}
//             className="border p-2"
//           />
//           <button
//             onClick={clearCanvas}
//             className="bg-red-500 text-white px-4 py-2"
//           >
//             Clear
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Whiteboard;

///-----------------------yang diganti jadi dibawah ini --------------------------///

import React, { useRef, useEffect, useState } from "react";
import socket from "../socket";

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#000");
  const [currentShape, setCurrentShape] = useState(null); // Track the shape being drawn
  const [startPoint, setStartPoint] = useState(null); // Track where the shape starts
  const [shapes, setShapes] = useState([]); // Store all the drawn shapes

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

  // Start drawing function for freehand or shapes
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setDrawing(true);
    if (currentShape) {
      setStartPoint({ x: offsetX, y: offsetY }); // Start point for shapes
    } else {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
    }
  };

  // Draw function for both freehand and shapes
  const draw = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    if (!drawing) return;

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
      // Freehand drawing
      ctxRef.current.strokeStyle = brushColor;
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
      socket.emit("draw", { offsetX, offsetY, brushColor });
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
    if (!currentShape) {
      ctxRef.current.closePath();
    }
  };

  // Draw existing data on canvas
  const drawOnCanvas = (data) => {
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
      // Freehand drawing
      ctx.lineTo(data.offsetX, data.offsetY);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear_board");
  };

  // Handle shape selection
  const handleShapeSelection = (shape) => {
    setCurrentShape(shape);
    setStartPoint(null); // Reset the start point
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

        {/* Shape Buttons */}
        <button
          onClick={() => handleShapeSelection("rectangle")}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Rectangle
        </button>
        <button
          onClick={() => handleShapeSelection("circle")}
          className="bg-green-500 text-white px-4 py-2"
        >
          Circle
        </button>
        <button
          onClick={() => handleShapeSelection(null)} // Freehand drawing
          className="bg-gray-500 text-white px-4 py-2"
        >
          Freehand
        </button>

        {/* Clear Button */}
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
