const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security headers and CSP
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "media-src 'self' blob:; " +
        "connect-src 'self' ws: wss:; " +
        "font-src 'self'"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Route for root path to serve lobby.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'lobby.html'));
});

// Route for lobby
app.get('/lobby.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'lobby.html'));
});

// Route for room
app.get('/room.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'room.html'));
});

// Store room information
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (roomId, userId, displayName) => {
        socket.join(roomId);
        socket.userId = userId;
        socket.displayName = displayName;
        socket.roomId = roomId;

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }

        const room = rooms.get(roomId);
        room.set(userId, {
            socketId: socket.id,
            displayName: displayName,
            userId: userId
        });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', userId, displayName);

        // Send current room members to the new user
        const members = Array.from(room.values()).map(member => ({
            userId: member.userId,
            displayName: member.displayName
        }));
        
        socket.emit('room-members', members);
        
        // Update member count for all users in room
        io.to(roomId).emit('member-count', room.size);

        console.log(`User ${displayName} (${userId}) joined room ${roomId}`);
    });

    // WebRTC signaling
    socket.on('offer', (offer, targetUserId) => {
        const room = rooms.get(socket.roomId);
        if (room && room.has(targetUserId)) {
            const targetSocketId = room.get(targetUserId).socketId;
            io.to(targetSocketId).emit('offer', offer, socket.userId);
        }
    });

    socket.on('answer', (answer, targetUserId) => {
        const room = rooms.get(socket.roomId);
        if (room && room.has(targetUserId)) {
            const targetSocketId = room.get(targetUserId).socketId;
            io.to(targetSocketId).emit('answer', answer, socket.userId);
        }
    });

    socket.on('ice-candidate', (candidate, targetUserId) => {
        const room = rooms.get(socket.roomId);
        if (room && room.has(targetUserId)) {
            const targetSocketId = room.get(targetUserId).socketId;
            io.to(targetSocketId).emit('ice-candidate', candidate, socket.userId);
        }
    });

    // Chat messaging
    socket.on('chat-message', (message) => {
        socket.to(socket.roomId).emit('chat-message', {
            displayName: socket.displayName,
            message: message,
            userId: socket.userId
        });
    });

    // User media state changes
    socket.on('media-state-change', (mediaState) => {
        socket.to(socket.roomId).emit('user-media-state', socket.userId, mediaState);
    });

    // Screen sharing
    socket.on('screen-share-start', () => {
        socket.to(socket.roomId).emit('user-screen-share-start', socket.userId);
    });

    socket.on('screen-share-stop', () => {
        socket.to(socket.roomId).emit('user-screen-share-stop', socket.userId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.roomId && socket.userId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                room.delete(socket.userId);
                
                // Notify others in the room
                socket.to(socket.roomId).emit('user-left', socket.userId, socket.displayName);
                
                // Update member count
                io.to(socket.roomId).emit('member-count', room.size);
                
                // Clean up empty rooms
                if (room.size === 0) {
                    rooms.delete(socket.roomId);
                }
            }
        }
    });

    // Explicit leave room
    socket.on('leave-room', () => {
        if (socket.roomId && socket.userId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                room.delete(socket.userId);
                socket.to(socket.roomId).emit('user-left', socket.userId, socket.displayName);
                io.to(socket.roomId).emit('member-count', room.size);
                
                if (room.size === 0) {
                    rooms.delete(socket.roomId);
                }
            }
            socket.leave(socket.roomId);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to access the application`);
});
