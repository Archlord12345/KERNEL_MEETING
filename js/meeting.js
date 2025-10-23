// JavaScript pour l'interface de vidéoconférence

// Variables globales
let localStream = null;
let remoteStreams = {};
let peerConnections = {};
let socket = null;
let roomId = null;
let isHost = false;
let isMuted = false;
let isVideoOff = false;
let isChatOpen = true;
let isScreenSharing = false;

// Configuration WebRTC
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeMeeting();
});

async function initializeMeeting() {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    roomId = urlParams.get('room');
    isHost = urlParams.get('host') === 'true';
    
    if (!roomId) {
        showNotification('ID de réunion manquant', 'error');
        setTimeout(() => window.location.href = 'index.html', 3000);
        return;
    }
    
    // Initialiser Socket.IO
    initializeSocket();
    
    // Demander les permissions média
    try {
        await requestMediaPermissions();
        setupMeetingInterface();
        joinRoom();
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showNotification('Erreur d\'accès aux médias', 'error');
    }
}

function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connecté au serveur');
    });
    
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('chat-message', handleChatMessage);
    socket.on('room-full', () => {
        showNotification('La réunion est pleine', 'error');
        setTimeout(() => window.location.href = 'index.html', 3000);
    });
    
    socket.on('disconnect', () => {
        showNotification('Connexion perdue', 'warning');
    });
}

async function requestMediaPermissions() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: { echoCancellation: true, noiseSuppression: true }
        });
        
        // Afficher le flux local
        const localVideo = document.getElementById('mainVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Mettre à jour les vidéos des participants
        updateParticipantVideos();
        
    } catch (error) {
        console.error('Erreur d\'accès aux médias:', error);
        throw error;
    }
}

function setupMeetingInterface() {
    // Mettre à jour le titre de la réunion
    const meetingTitle = document.querySelector('.meeting-title');
    if (meetingTitle) {
        meetingTitle.textContent = `RÉUNION ${roomId}`;
    }
    
    // Configurer les contrôles
    setupMeetingControls();
    
    // Configurer le chat
    setupChatInterface();
    
    // Ajouter les événements
    setupEventListeners();
}

function setupMeetingControls() {
    const muteBtn = document.getElementById('muteBtn');
    const videoBtn = document.getElementById('videoBtn');
    
    if (muteBtn) {
        muteBtn.onclick = toggleMute;
    }
    
    if (videoBtn) {
        videoBtn.onclick = toggleVideo;
    }
}

function setupChatInterface() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function setupEventListeners() {
    // Gestion de la fermeture de la fenêtre
    window.addEventListener('beforeunload', () => {
        leaveRoom();
    });
    
    // Gestion des raccourcis clavier
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'e':
                    e.preventDefault();
                    toggleVideo();
                    break;
                case 'd':
                    e.preventDefault();
                    toggleScreenShare();
                    break;
            }
        }
    });
}

function joinRoom() {
    if (socket && roomId) {
        socket.emit('join-room', {
            roomId: roomId,
            isHost: isHost,
            userInfo: {
                name: 'Utilisateur', // À remplacer par le nom réel
                id: socket.id
            }
        });
    }
}

function leaveRoom() {
    if (socket && roomId) {
        socket.emit('leave-room', { roomId: roomId });
    }
    
    // Fermer toutes les connexions
    Object.values(peerConnections).forEach(pc => pc.close());
    
    // Arrêter les flux média
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
}

// Gestion WebRTC
async function handleUserJoined(data) {
    console.log('Utilisateur rejoint:', data);
    
    const peerConnection = createPeerConnection(data.userId);
    peerConnections[data.userId] = peerConnection;
    
    // Ajouter les tracks locaux
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
    
    // Créer une offre si on est l'initiateur
    if (data.shouldCreateOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('offer', {
            roomId: roomId,
            targetId: data.userId,
            offer: offer
        });
    }
    
    // Ajouter à l'interface
    addParticipantToUI(data);
}

function handleUserLeft(data) {
    console.log('Utilisateur parti:', data);
    
    // Fermer la connexion peer
    if (peerConnections[data.userId]) {
        peerConnections[data.userId].close();
        delete peerConnections[data.userId];
    }
    
    // Supprimer de l'interface
    removeParticipantFromUI(data.userId);
}

function createPeerConnection(userId) {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId: roomId,
                targetId: userId,
                candidate: event.candidate
            });
        }
    };
    
    peerConnection.ontrack = (event) => {
        console.log('Track reçu:', event);
        remoteStreams[userId] = event.streams[0];
        updateParticipantVideo(userId, event.streams[0]);
    };
    
    peerConnection.onconnectionstatechange = () => {
        console.log(`État de connexion avec ${userId}:`, peerConnection.connectionState);
    };
    
    return peerConnection;
}

async function handleOffer(data) {
    console.log('Offre reçue:', data);
    
    const peerConnection = createPeerConnection(data.fromId);
    peerConnections[data.fromId] = peerConnection;
    
    // Ajouter les tracks locaux
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
    
    await peerConnection.setRemoteDescription(data.offer);
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('answer', {
        roomId: roomId,
        targetId: data.fromId,
        answer: answer
    });
}

async function handleAnswer(data) {
    console.log('Réponse reçue:', data);
    
    const peerConnection = peerConnections[data.fromId];
    if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
    }
}

async function handleIceCandidate(data) {
    console.log('Candidat ICE reçu:', data);
    
    const peerConnection = peerConnections[data.fromId];
    if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
    }
}

// Contrôles de la réunion
function toggleMute() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isMuted = !audioTrack.enabled;
        
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.innerHTML = isMuted ? 
                '<i class="fas fa-microphone-slash"></i>' : 
                '<i class="fas fa-microphone"></i>';
            muteBtn.classList.toggle('muted', isMuted);
        }
        
        showNotification(isMuted ? 'Micro coupé' : 'Micro activé', 'info');
    }
}

function toggleVideo() {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isVideoOff = !videoTrack.enabled;
        
        const videoBtn = document.getElementById('videoBtn');
        if (videoBtn) {
            videoBtn.innerHTML = isVideoOff ? 
                '<i class="fas fa-video-slash"></i>' : 
                '<i class="fas fa-video"></i>';
            videoBtn.classList.toggle('video-off', isVideoOff);
        }
        
        showNotification(isVideoOff ? 'Caméra désactivée' : 'Caméra activée', 'info');
    }
}

async function toggleScreenShare() {
    try {
        if (!isScreenSharing) {
            // Démarrer le partage d'écran
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            // Remplacer le track vidéo
            const videoTrack = screenStream.getVideoTracks()[0];
            const sender = Object.values(peerConnections).map(pc => 
                pc.getSenders().find(s => s.track && s.track.kind === 'video')
            ).filter(Boolean)[0];
            
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
            
            // Mettre à jour l'interface
            const mainVideo = document.getElementById('mainVideo');
            if (mainVideo) {
                mainVideo.srcObject = screenStream;
            }
            
            isScreenSharing = true;
            showNotification('Partage d\'écran démarré', 'success');
            
            // Écouter l'arrêt du partage
            videoTrack.onended = () => {
                stopScreenShare();
            };
            
        } else {
            stopScreenShare();
        }
    } catch (error) {
        console.error('Erreur de partage d\'écran:', error);
        showNotification('Erreur lors du partage d\'écran', 'error');
    }
}

async function stopScreenShare() {
    if (!localStream) return;
    
    try {
        // Revenir à la caméra
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = Object.values(peerConnections).map(pc => 
            pc.getSenders().find(s => s.track && s.track.kind === 'video')
        ).filter(Boolean)[0];
        
        if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
        }
        
        // Mettre à jour l'interface
        const mainVideo = document.getElementById('mainVideo');
        if (mainVideo) {
            mainVideo.srcObject = localStream;
        }
        
        isScreenSharing = false;
        showNotification('Partage d\'écran arrêté', 'info');
        
    } catch (error) {
        console.error('Erreur lors de l\'arrêt du partage:', error);
    }
}

function leaveMeeting() {
    if (confirm('Êtes-vous sûr de vouloir quitter la réunion ?')) {
        leaveRoom();
        window.location.href = 'index.html';
    }
}

// Gestion du chat
function toggleChat() {
    const chatPanel = document.getElementById('chatPanel');
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    
    if (chatPanel && chatToggleBtn) {
        isChatOpen = !isChatOpen;
        
        if (isChatOpen) {
            chatPanel.style.display = 'flex';
            chatToggleBtn.style.display = 'none';
        } else {
            chatPanel.style.display = 'none';
            chatToggleBtn.style.display = 'flex';
        }
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput?.value?.trim();
    
    if (!message) return;
    
    const messageData = {
        roomId: roomId,
        message: message,
        sender: 'Vous', // À remplacer par le nom réel
        timestamp: new Date().toISOString()
    };
    
    // Envoyer via socket
    if (socket) {
        socket.emit('chat-message', messageData);
    }
    
    // Ajouter à l'interface locale
    addMessageToChat(messageData, true);
    
    // Vider le champ
    messageInput.value = '';
}

function handleChatMessage(data) {
    addMessageToChat(data, false);
    
    // Notification si le chat est fermé
    if (!isChatOpen) {
        updateChatBadge();
    }
}

function addMessageToChat(messageData, isOwn = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const time = new Date(messageData.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const senderInitial = messageData.sender.charAt(0).toUpperCase();
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <div class="avatar online">${senderInitial}</div>
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${messageData.sender}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(messageData.message)}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateChatBadge() {
    const badge = document.getElementById('chatBadge');
    if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        badge.style.display = 'flex';
    }
}

function handleMessageInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}

// Gestion de l'interface des participants
function addParticipantToUI(userData) {
    const participantsStrip = document.querySelector('.participants-strip');
    if (!participantsStrip) return;
    
    const participantElement = document.createElement('div');
    participantElement.className = 'participant-video';
    participantElement.id = `participant-${userData.userId}`;
    
    participantElement.innerHTML = `
        <video autoplay></video>
        <div class="participant-info">
            <div class="participant-status online"></div>
            <span class="participant-name">${userData.userInfo?.name || 'Participant'}</span>
        </div>
    `;
    
    participantsStrip.appendChild(participantElement);
}

function removeParticipantFromUI(userId) {
    const participantElement = document.getElementById(`participant-${userId}`);
    if (participantElement) {
        participantElement.remove();
    }
}

function updateParticipantVideo(userId, stream) {
    const participantElement = document.getElementById(`participant-${userId}`);
    if (participantElement) {
        const video = participantElement.querySelector('video');
        if (video) {
            video.srcObject = stream;
        }
    }
}

function updateParticipantVideos() {
    // Mettre à jour la vidéo locale dans la bande des participants
    const localParticipant = document.querySelector('.participant-video.active video');
    if (localParticipant && localStream) {
        localParticipant.srcObject = localStream;
    }
}

// Utilitaires
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Utiliser la fonction de notification globale si disponible
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback simple
    console.log(`${type.toUpperCase()}: ${message}`);
}

function toggleSettings() {
    showNotification('Paramètres à venir', 'info');
}

// Export des fonctions pour utilisation globale
window.toggleMute = toggleMute;
window.toggleVideo = toggleVideo;
window.toggleScreenShare = toggleScreenShare;
window.leaveMeeting = leaveMeeting;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleMessageInput = handleMessageInput;
window.toggleSettings = toggleSettings;
