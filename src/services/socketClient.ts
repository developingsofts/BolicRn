import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '../config/constants';

let socket: Socket | null = null;
let tokenCache: string | null = null;

const deriveSocketUrl = (url: string): string => {
  const trimmed = url.replace(/\/$/, '');

  try {
    const parsed = new URL(trimmed);
    // If the API URL already points to the root, reuse it. Otherwise drop the path (e.g. /api).
    return `${parsed.protocol}//${parsed.host}`;
  } catch (error) {
    // Fallback: strip a trailing /api or similar segment if present.
    return trimmed.replace(/\/(api|v1|v2)$/i, '');
  }
};

const SOCKET_URL = deriveSocketUrl(SOCKET_CONFIG.baseUrl);

const createSocketInstance = (token: string): Socket =>
  io(SOCKET_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false,
    auth: { token },
    path: SOCKET_CONFIG.path || '/socket.io',
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
