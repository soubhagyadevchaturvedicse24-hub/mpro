import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketUrl } from '../services/api';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth(); // Assuming useAuth provides the JWT token

  useEffect(() => {
    // Connect to the backend WebSocket server dynamically
    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      auth: token ? { token } : {},
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time telemetry server');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection note:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
