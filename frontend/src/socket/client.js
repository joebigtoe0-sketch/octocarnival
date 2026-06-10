import { io } from 'socket.io-client';

// In dev: '/' connects to the Vite proxy which forwards to the backend.
// In production: VITE_API_URL points directly to the Railway backend service.
const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
