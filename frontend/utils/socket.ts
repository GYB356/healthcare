import { io, Socket } from 'socket.io-client';

// Create a singleton socket instance
let socket: Socket;

// Connection status
let isConnected = false;

// Initialize socket connection
const initSocket = (): Socket => {
  if (!socket) {
    // Connect to the server
    socket = io('http://localhost:5000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
      isConnected = true;
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      isConnected = false;
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnected = false;
    });
  }

  return socket;
};

// Get the socket instance
const getSocket = (): Socket => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Connect to the socket server with user ID for room
export const connectSocket = (userId: string): void => {
  const socketInstance = getSocket();
  
  if (!socketInstance.connected) {
    socketInstance.connect();
  }
  
  // Join a room with the user's ID
  socketInstance.emit('joinRoom', userId);
};

// Disconnect from the socket server
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

// Check if socket is connected
export const isSocketConnected = (): boolean => {
  return isConnected;
};

// Initialize and export the socket instance
export const socket = getSocket(); 