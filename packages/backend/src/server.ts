import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { app } from './app';
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (data: { userId: string, role: string }) => {
        socket.join(`user-${data.userId}`);
        if (data.role === 'PARENT') {
            socket.join(`parent-${data.userId}`);
        }
        if (data.role === 'HEADMASTER') {
            socket.join('admin-room');
        }
        console.log(`Socket ${socket.id} joined rooms for ${data.role} ${data.userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { io };
