import { io } from 'socket.io-client';

// Update this to your machine's local IP when running on a physical device
export const SERVER_URL = 'http://192.168.2.30:3001';

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('[Socket] Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
});

socket.on('connect_error', (err) => {
  console.warn('[Socket] Connection error:', err.message);
});
