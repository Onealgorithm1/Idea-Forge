import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:5001');
    const newSocket = io(socketUrl, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('vote_update', (data: { id: string, votes_count: number }) => {
      console.log('Real-time vote update:', data);

      // Manually update TanStack Query cache for all relevant queries
      queryClient.setQueriesData({ queryKey: ['ideas'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((idea: any) =>
          idea.id === data.id ? { ...idea, votes_count: data.votes_count } : idea
        );
      });

      queryClient.setQueriesData({ queryKey: ['user-ideas'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((idea: any) =>
          idea.id === data.id ? { ...idea, votes_count: data.votes_count } : idea
        );
      });

      // Special handling for single idea if it's currently being viewed
      queryClient.setQueriesData({ queryKey: ['idea', data.id] }, (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, votes_count: data.votes_count };
      });
    });

    newSocket.on('status_update', (data: { id: string, status: string }) => {
      console.log('Real-time status update:', data);

      queryClient.setQueriesData({ queryKey: ['ideas'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((idea: any) =>
          idea.id === data.id ? { ...idea, status: data.status } : idea
        );
      });

      queryClient.setQueriesData({ queryKey: ['user-ideas'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((idea: any) =>
          idea.id === data.id ? { ...idea, status: data.status } : idea
        );
      });

      queryClient.setQueriesData({ queryKey: ['idea', data.id] }, (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, status: data.status };
      });

      // Also invalidate ideas query after a short delay to ensure consistency
      // queryClient.invalidateQueries({ queryKey: ['ideas'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
