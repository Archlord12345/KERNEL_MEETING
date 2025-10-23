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
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: blob:; " +
        "media-src 'self' blob:; " +
        "connect-src 'self' ws: wss:; "
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Routes pour les nouvelles pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/create-meeting.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'create-meeting.html'));
});

app.get('/meeting.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'meeting.html'));
});

// Routes de compatibilité avec l'ancien système
app.get('/lobby.html', (req, res) => {
    res.redirect('/');
});

app.get('/room.html', (req, res) => {
    res.redirect('/meeting.html' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''));
});

// Store room information and meetings
const rooms = new Map();
const meetings = new Map();

// Utilitaires
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '').trim().substring(0, 500);
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Créer une nouvelle réunion
    socket.on('create-meeting', (meetingData) => {
        try {
            const roomId = generateRoomId();
            const sanitizedData = {
                id: roomId,
                title: sanitizeInput(meetingData.title) || 'Nouvelle réunion',
                description: sanitizeInput(meetingData.description) || '',
                date: meetingData.date,
                time: meetingData.time,
                duration: parseInt(meetingData.duration) || 60,
                language: meetingData.language || 'fr',
                requirePassword: Boolean(meetingData.requirePassword),
                password: meetingData.requirePassword ? sanitizeInput(meetingData.password) : '',
                maxParticipants: Math.min(parseInt(meetingData.maxParticipants) || 10, 100),
                enableRecording: Boolean(meetingData.enableRecording),
                createdAt: new Date().toISOString(),
                createdBy: socket.id,
                participants: new Map()
            };

            meetings.set(roomId, sanitizedData);
            rooms.set(roomId, new Map());

            socket.emit('meeting-created', {
                roomId: roomId,
                meetingData: sanitizedData
            });

            console.log(`Meeting created: ${roomId} - ${sanitizedData.title}`);
        } catch (error) {
            console.error('Error creating meeting:', error);
            socket.emit('error', { message: 'Erreur lors de la création de la réunion' });
        }
    });

    // Rejoindre une réunion
    socket.on('join-meeting', (data) => {
        try {
            const roomId = sanitizeInput(data.roomId);
            if (!roomId) {
                socket.emit('error', { message: 'ID de réunion invalide' });
                return;
            }

            // Vérifier si la réunion existe ou la créer
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Map());
                console.log(`Room created: ${roomId}`);
            }

            const room = rooms.get(roomId);
            const meeting = meetings.get(roomId);

            // Vérifier la limite de participants
            if (meeting && room.size >= meeting.maxParticipants) {
                socket.emit('room-full');
                return;
            }

            // Vérifier le mot de passe si requis
            if (meeting && meeting.requirePassword && data.password !== meeting.password) {
                socket.emit('error', { message: 'Mot de passe incorrect' });
                return;
            }

            socket.emit('meeting-joined', { roomId: roomId });
        } catch (error) {
            console.error('Error joining meeting:', error);
            socket.emit('error', { message: 'Erreur lors de la connexion à la réunion' });
        }
    });

    // Rejoindre une salle (nouvelle version)
    socket.on('join-room', (data) => {
        try {
            const roomId = typeof data === 'string' ? data : data.roomId;
            const userInfo = data.userInfo || { name: 'Utilisateur', id: socket.id };
            
            socket.join(roomId);
            socket.userId = userInfo.id;
            socket.displayName = sanitizeInput(userInfo.name) || 'Utilisateur';
            socket.roomId = roomId;

            // Initialize room if it doesn't exist
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Map());
            }

            const room = rooms.get(roomId);
            const isFirstUser = room.size === 0;
            
            room.set(socket.userId, {
                socketId: socket.id,
                displayName: socket.displayName,
                userId: socket.userId,
                joinedAt: new Date().toISOString()
            });

            // Notifier les autres utilisateurs
            socket.to(roomId).emit('user-joined', {
                userId: socket.userId,
                userInfo: {
                    name: socket.displayName,
                    id: socket.userId
                },
                shouldCreateOffer: !isFirstUser
            });

            // Envoyer les membres actuels au nouvel utilisateur
            const members = Array.from(room.values()).map(member => ({
                userId: member.userId,
                displayName: member.displayName,
                joinedAt: member.joinedAt
            }));
            
            socket.emit('room-members', members);
            
            // Mettre à jour le nombre de participants
            io.to(roomId).emit('member-count', room.size);

            console.log(`User ${socket.displayName} (${socket.userId}) joined room ${roomId}`);
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Erreur lors de la connexion à la salle' });
        }
    });

    // WebRTC signaling (nouvelle version)
    socket.on('offer', (data) => {
        try {
            const room = rooms.get(socket.roomId);
            if (room && room.has(data.targetId)) {
                const targetSocketId = room.get(data.targetId).socketId;
                io.to(targetSocketId).emit('offer', {
                    offer: data.offer,
                    fromId: socket.userId,
                    roomId: data.roomId
                });
            }
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    });

    socket.on('answer', (data) => {
        try {
            const room = rooms.get(socket.roomId);
            if (room && room.has(data.targetId)) {
                const targetSocketId = room.get(data.targetId).socketId;
                io.to(targetSocketId).emit('answer', {
                    answer: data.answer,
                    fromId: socket.userId,
                    roomId: data.roomId
                });
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    });

    socket.on('ice-candidate', (data) => {
        try {
            const room = rooms.get(socket.roomId);
            if (room && room.has(data.targetId)) {
                const targetSocketId = room.get(data.targetId).socketId;
                io.to(targetSocketId).emit('ice-candidate', {
                    candidate: data.candidate,
                    fromId: socket.userId,
                    roomId: data.roomId
                });
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    });

    // Chat messaging (amélioré)
    socket.on('chat-message', (data) => {
        try {
            const sanitizedMessage = sanitizeInput(data.message);
            if (!sanitizedMessage || sanitizedMessage.length === 0) {
                return;
            }

            const messageData = {
                message: sanitizedMessage,
                sender: socket.displayName || 'Utilisateur',
                senderId: socket.userId,
                timestamp: new Date().toISOString(),
                roomId: data.roomId || socket.roomId
            };

            // Diffuser à tous les autres participants de la salle
            socket.to(socket.roomId).emit('chat-message', messageData);
            
            console.log(`Chat message in room ${socket.roomId}: ${socket.displayName}: ${sanitizedMessage}`);
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    });

    // User media state changes
    socket.on('media-state-change', (mediaState) => {
        try {
            socket.to(socket.roomId).emit('user-media-state', {
                userId: socket.userId,
                mediaState: mediaState
            });
        } catch (error) {
            console.error('Error handling media state change:', error);
        }
    });

    // Screen sharing
    socket.on('screen-share-start', () => {
        try {
            socket.to(socket.roomId).emit('user-screen-share-start', {
                userId: socket.userId,
                displayName: socket.displayName
            });
            console.log(`User ${socket.displayName} started screen sharing in room ${socket.roomId}`);
        } catch (error) {
            console.error('Error handling screen share start:', error);
        }
    });

    socket.on('screen-share-stop', () => {
        try {
            socket.to(socket.roomId).emit('user-screen-share-stop', {
                userId: socket.userId,
                displayName: socket.displayName
            });
            console.log(`User ${socket.displayName} stopped screen sharing in room ${socket.roomId}`);
        } catch (error) {
            console.error('Error handling screen share stop:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        handleUserLeave();
    });

    // Explicit leave room
    socket.on('leave-room', (data) => {
        console.log(`User ${socket.displayName} explicitly leaving room ${socket.roomId}`);
        handleUserLeave();
        socket.leave(socket.roomId);
    });

    // Fonction utilitaire pour gérer le départ d'un utilisateur
    function handleUserLeave() {
        if (socket.roomId && socket.userId) {
            const room = rooms.get(socket.roomId);
            const meeting = meetings.get(socket.roomId);
            
            if (room) {
                room.delete(socket.userId);
                
                // Notifier les autres participants
                socket.to(socket.roomId).emit('user-left', {
                    userId: socket.userId,
                    displayName: socket.displayName,
                    leftAt: new Date().toISOString()
                });
                
                // Mettre à jour le nombre de participants
                io.to(socket.roomId).emit('member-count', room.size);
                
                console.log(`User ${socket.displayName} left room ${socket.roomId}. Remaining: ${room.size}`);
                
                // Nettoyer les salles vides
                if (room.size === 0) {
                    rooms.delete(socket.roomId);
                    if (meeting) {
                        meetings.delete(socket.roomId);
                    }
                    console.log(`Room ${socket.roomId} cleaned up (empty)`);
                }
            }
        }
    }
});

// API REST pour obtenir des informations sur les réunions
app.get('/api/meetings', (req, res) => {
    try {
        const activeMeetings = Array.from(meetings.values()).map(meeting => ({
            id: meeting.id,
            title: meeting.title,
            participantCount: rooms.get(meeting.id)?.size || 0,
            maxParticipants: meeting.maxParticipants,
            createdAt: meeting.createdAt,
            requirePassword: meeting.requirePassword
        }));
        
        res.json({ meetings: activeMeetings });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/meetings/:roomId', (req, res) => {
    try {
        const roomId = req.params.roomId;
        const meeting = meetings.get(roomId);
        const room = rooms.get(roomId);
        
        if (!meeting) {
            return res.status(404).json({ error: 'Réunion non trouvée' });
        }
        
        res.json({
            meeting: {
                ...meeting,
                participantCount: room?.size || 0,
                participants: room ? Array.from(room.values()).map(p => ({
                    displayName: p.displayName,
                    joinedAt: p.joinedAt
                })) : []
            }
        });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Nettoyage périodique des anciennes réunions (toutes les heures)
setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const [roomId, meeting] of meetings.entries()) {
        const createdAt = new Date(meeting.createdAt);
        const room = rooms.get(roomId);
        
        // Supprimer les réunions vides de plus d'une heure
        if (createdAt < oneHourAgo && (!room || room.size === 0)) {
            meetings.delete(roomId);
            rooms.delete(roomId);
            console.log(`Cleaned up old empty meeting: ${roomId}`);
        }
    }
}, 60 * 60 * 1000); // Toutes les heures

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to access the application`);
});
