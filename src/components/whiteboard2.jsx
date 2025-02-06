import React, { useRef, useState, useEffect } from 'react';
import { FaUndo, FaRedo } from 'react-icons/fa';

const Whiteboard2 = () => {
const canvasRef = useRef(null);
const [zoom, setZoom] = useState(1);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isDrawing, setIsDrawing] = useState(false);
const [history, setHistory] = useState([]);
const [historyIndex, setHistoryIndex] = useState(-1);
const [currentPath, setCurrentPath] = useState([]);

const handleWheel = (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const newZoom = zoom * (e.deltaY > 0 ? 0.9 : 1.1);
        setZoom(Math.min(Math.max(0.1, newZoom), 5)); // Limit zoom between 0.1x and 5x
    }
};

const handlePan = (e) => {
    if (e.buttons === 4 || (e.buttons === 1 && e.altKey)) { // Middle mouse button or Alt + Left mouse
        setPan({
            x: pan.x + e.movementX,
            y: pan.y + e.movementY
        });
    }
};

const saveToHistory = (imageData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
};

const undo = () => {
    if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1);
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.src = history[historyIndex - 1];
    img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
    };
    }
};

const redo = () => {
    if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1);
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image();
    img.src = history[historyIndex + 1];
    img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
    };
    }
};

const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
};

const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    ctx.lineTo(x, y);
    ctx.stroke();
    setCurrentPath([...currentPath, { x, y }]);
};

const stopDrawing = () => {
    if (isDrawing) {
    setIsDrawing(false);
    saveToHistory(canvasRef.current.toDataURL());
    }
};

useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
}, []);

return (
    <div className="flex flex-col h-full">
    <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center p-2">
        <div className="flex space-x-2">
            <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            data-tooltip-content="Undo"
            data-tooltip-id="toolbar"
            >
            <FaUndo />
            </button>
            <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            data-tooltip-content="Redo"
            data-tooltip-id="toolbar"
            >
            <FaRedo />
            </button>
        </div>
        </div>
    </div>
    <div className="flex-1 overflow-hidden relative">
        <div
        className="absolute w-full h-full"
        style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "center",
        }}
        >
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
                draw(e);
                handlePan(e);
            }}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onWheel={handleWheel}
            onBlur={stopDrawing}
            className="bg-white cursor-crosshair"
            style={{ width: "100%", height: "100%" }}
        />
        </div>
    </div>
    </div>
);
};

export default Whiteboard2;

