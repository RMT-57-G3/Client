import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Routes, Route} from "react-router";
import "./index.css";
import Whiteboard from "./components/Whiteboard";
import {WhiteboardProvider} from "./components/WhiteBoardContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WhiteboardProvider>
      <App />
    </WhiteboardProvider>
  </StrictMode>
);