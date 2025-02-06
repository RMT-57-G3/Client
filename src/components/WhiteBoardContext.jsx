import {createContext, useState, useEffect, useMemo} from "react";

export const WhiteboardContext = createContext();

export const WhiteboardProvider = ({children}) => {
  const [brushColor, setBrushColor] = useState("#000000");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [isEraser, setIsEraser] = useState(false); // Eraser Mode

  useEffect(() => {
    document.querySelector("html").classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
    setBrushColor(darkMode ? "#ffffff" : "#000000");
  }, [darkMode]);

  const contextValue = useMemo(() => ({
    brushColor,
    setBrushColor,
    darkMode,
    setDarkMode,
    isEraser,
    setIsEraser
  }), [brushColor, setBrushColor, darkMode, setDarkMode, isEraser, setIsEraser]);

  return (
    <WhiteboardContext.Provider value={contextValue}>
      {children}
    </WhiteboardContext.Provider>
  );
};