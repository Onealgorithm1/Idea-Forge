import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for now, in production specific origins should be used
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const emitVoteUpdate = (ideaId: string, votesCount: number) => {
  if (io) {
    io.emit('vote_update', { id: ideaId, votes_count: votesCount });
  }
};

export const emitStatusUpdate = (ideaId: string, status: string) => {
  if (io) {
    io.emit('status_update', { id: ideaId, status });
  }
};

export const getIO = () => io;
