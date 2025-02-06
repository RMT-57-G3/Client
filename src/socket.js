import { io } from "socket.io-client";

const socket = io("https://collaborative-whiteboard-be.onrender.com/");

export default socket;
