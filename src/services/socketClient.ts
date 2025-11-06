import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/constants';

let socket: Socket | null = null;
let tokenCache: string | null = null;

const BASE_URL = API_CONFIG.baseUrl.replace(/\/$/, '');

const createSocketInstance = (token: string): Socket =>
  io(BASE_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false,
    auth: { token },
  });

export const initializeSocket = (token: string): Socket => {
  if (!token) {
    throw new Error('Missing authentication token for socket connection');
  }

  if (!socket) {
    socket = createSocketInstance(token);
    tokenCache = token;
  } else if (tokenCache !== token) {
    // Update auth payload if token has changed
    socket.auth = { token };
    tokenCache = token;
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    tokenCache = null;
  }
};
