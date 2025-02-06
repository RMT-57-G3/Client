import {BrowserRouter, Route, Routes} from "react-router";
import Whiteboard from "./components/Whiteboard.jsx";
import {useContext} from "react";
import {WhiteboardContext} from "./components/WhiteBoardContext.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Whiteboard/>}/>
      </Routes>
    </BrowserRouter>
  )
}