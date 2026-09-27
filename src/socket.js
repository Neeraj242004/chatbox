import { io } from "socket.io-client";

const socket = io("https://chatbox-djaw.onrender.com");

export default socket;