// WebRTC implementation to replace Agora RTC
class WebRTCManager {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.localScreenStream = null;
        this.peerConnections = new Map();
        this.remoteStreams = new Map();
        this.isScreenSharing = false;
        this.roomId = null;
        this.userId = null;
        this.displayName = null;
        
        // WebRTC configuration
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    // Initialize Socket.IO connection
    initializeSocket() {
        this.socket = io();
        
        this.socket.on('user-joined', (userId, displayName) => {
            console.log('User joined:', displayName);
            this.handleUserJoined(userId, displayName);
        });

        this.socket.on('user-left', (userId, displayName) => {
            console.log('User left:', displayName);
            this.handleUserLeft(userId, displayName);
        });

        this.socket.on('offer', (offer, fromUserId) => {
            this.handleOffer(offer, fromUserId);
        });

        this.socket.on('answer', (answer, fromUserId) => {
            this.handleAnswer(answer, fromUserId);
        });

        this.socket.on('ice-candidate', (candidate, fromUserId) => {
            this.handleIceCandidate(candidate, fromUserId);
        });

        this.socket.on('room-members', (members) => {
            this.handleRoomMembers(members);
        });

        this.socket.on('member-count', (count) => {
            this.updateMemberCount(count);
        });

        this.socket.on('chat-message', (data) => {
            this.handleChatMessage(data);
        });

        this.socket.on('user-media-state', (userId, mediaState) => {
            this.handleUserMediaState(userId, mediaState);
        });
    }

    // Join room
    async joinRoom(roomId, userId, displayName) {
        this.roomId = roomId;
        this.userId = userId;
        this.displayName = displayName;
        
        this.socket.emit('join-room', roomId, userId, displayName);
        
        // Add welcome message
        addBotMessageToDom(`Welcome to the room ${displayName}! 👋`);
    }

    // Handle new user joined
    async handleUserJoined(userId, displayName) {
        addBotMessageToDom(`${displayName} joined the room! 👋`);
        addMemberToDom(userId, displayName);
        
        // If we have a local stream, create peer connection and send offer
        if (this.localStream) {
            await this.createPeerConnection(userId);
            await this.sendOffer(userId);
        }
    }

    // Handle user left
    handleUserLeft(userId, displayName) {
        addBotMessageToDom(`${displayName} left the room.`);
        this.removePeerConnection(userId);
        this.removeUserFromDOM(userId);
        removeMemberFromDom(userId);
    }

    // Handle room members
    handleRoomMembers(members) {
        members.forEach(member => {
            if (member.userId !== this.userId) {
                addMemberToDom(member.userId, member.displayName);
            }
        });
    }

    // Update member count
    updateMemberCount(count) {
        const memberCountElement = document.getElementById('members__count');
        if (memberCountElement) {
            memberCountElement.innerText = count;
        }
    }

    // Create peer connection
    async createPeerConnection(userId) {
        const peerConnection = new RTCPeerConnection(this.rtcConfig);
        this.peerConnections.set(userId, peerConnection);

        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            this.remoteStreams.set(userId, remoteStream);
            this.displayRemoteStream(userId, remoteStream);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', event.candidate, userId);
            }
        };

        return peerConnection;
    }

    // Send offer
    async sendOffer(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (!peerConnection) return;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.socket.emit('offer', offer, userId);
    }

    // Handle offer
    async handleOffer(offer, fromUserId) {
        const peerConnection = await this.createPeerConnection(fromUserId);
        await peerConnection.setRemoteDescription(offer);
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        this.socket.emit('answer', answer, fromUserId);
    }

    // Handle answer
    async handleAnswer(answer, fromUserId) {
        const peerConnection = this.peerConnections.get(fromUserId);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(answer);
        }
    }

    // Handle ICE candidate
    async handleIceCandidate(candidate, fromUserId) {
        const peerConnection = this.peerConnections.get(fromUserId);
        if (peerConnection) {
            await peerConnection.addIceCandidate(candidate);
        }
    }

    // Get user media (camera and microphone)
    async getUserMedia() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { min: 640, ideal: 1920, max: 1920 },
                    height: { min: 480, ideal: 1080, max: 1080 }
                },
                audio: true
            });
            
            this.displayLocalStream();
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }

    // Display local stream
    displayLocalStream() {
        const player = `<div class="video__container" id="user-container-${this.userId}">
                        <div class="video-player" id="user-${this.userId}"></div>
                     </div>`;
        
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${this.userId}`).addEventListener('click', expandVideoFrame);
        
        const videoElement = document.createElement('video');
        videoElement.srcObject = this.localStream;
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        
        document.getElementById(`user-${this.userId}`).appendChild(videoElement);
    }

    // Display remote stream
    displayRemoteStream(userId, stream) {
        let player = document.getElementById(`user-container-${userId}`);
        if (!player) {
            const playerHTML = `<div class="video__container" id="user-container-${userId}">
                                <div class="video-player" id="user-${userId}"></div>
                            </div>`;
            
            document.getElementById('streams__container').insertAdjacentHTML('beforeend', playerHTML);
            document.getElementById(`user-container-${userId}`).addEventListener('click', expandVideoFrame);
            player = document.getElementById(`user-container-${userId}`);
        }

        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        
        const playerDiv = document.getElementById(`user-${userId}`);
        playerDiv.innerHTML = '';
        playerDiv.appendChild(videoElement);

        // Handle display frame sizing
        if (displayFrame.style.display) {
            player.style.height = '100px';
            player.style.width = '100px';
        }
    }

    // Remove user from DOM
    removeUserFromDOM(userId) {
        const userContainer = document.getElementById(`user-container-${userId}`);
        if (userContainer) {
            userContainer.remove();
        }

        // Handle display frame cleanup
        if (userIdInDisplayFrame === `user-container-${userId}`) {
            displayFrame.style.display = null;
            
            const videoFrames = document.getElementsByClassName('video__container');
            for (let i = 0; i < videoFrames.length; i++) {
                videoFrames[i].style.height = '300px';
                videoFrames[i].style.width = '300px';
            }
        }
    }

    // Remove peer connection
    removePeerConnection(userId) {
        const peerConnection = this.peerConnections.get(userId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(userId);
        }
        this.remoteStreams.delete(userId);
    }

    // Toggle microphone
    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.socket.emit('media-state-change', { audio: audioTrack.enabled });
                return audioTrack.enabled;
            }
        }
        return false;
    }

    // Toggle camera
    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.socket.emit('media-state-change', { video: videoTrack.enabled });
                return videoTrack.enabled;
            }
        }
        return false;
    }

    // Start screen sharing
    async startScreenShare() {
        try {
            this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            this.isScreenSharing = true;
            this.socket.emit('screen-share-start');

            // Replace video track in all peer connections
            const videoTrack = this.localScreenStream.getVideoTracks()[0];
            this.peerConnections.forEach(async (peerConnection) => {
                const sender = peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            });

            // Update local display
            const videoElement = document.querySelector(`#user-${this.userId} video`);
            if (videoElement) {
                videoElement.srcObject = this.localScreenStream;
            }

            // Handle screen share end
            videoTrack.onended = () => {
                this.stopScreenShare();
            };

            return true;
        } catch (error) {
            console.error('Error starting screen share:', error);
            return false;
        }
    }

    // Stop screen sharing
    async stopScreenShare() {
        if (this.localScreenStream) {
            this.localScreenStream.getTracks().forEach(track => track.stop());
            this.localScreenStream = null;
        }

        this.isScreenSharing = false;
        this.socket.emit('screen-share-stop');

        // Replace back to camera
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            this.peerConnections.forEach(async (peerConnection) => {
                const sender = peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            });

            // Update local display
            const videoElement = document.querySelector(`#user-${this.userId} video`);
            if (videoElement) {
                videoElement.srcObject = this.localStream;
            }
        }
    }

    // Send chat message
    sendChatMessage(message) {
        this.socket.emit('chat-message', message);
    }

    // Handle chat message
    handleChatMessage(data) {
        addMessageToDom(data.displayName, data.message);
    }

    // Handle user media state changes
    handleUserMediaState(userId, mediaState) {
        // You can add visual indicators for muted users here
        console.log(`User ${userId} media state:`, mediaState);
    }

    // Leave room
    async leaveRoom() {
        // Stop local streams
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.localScreenStream) {
            this.localScreenStream.getTracks().forEach(track => track.stop());
            this.localScreenStream = null;
        }

        // Close all peer connections
        this.peerConnections.forEach(peerConnection => {
            peerConnection.close();
        });
        this.peerConnections.clear();
        this.remoteStreams.clear();

        // Remove local user from DOM
        this.removeUserFromDOM(this.userId);

        // Notify server
        this.socket.emit('leave-room');
    }
}

// Create global WebRTC manager instance
const webrtcManager = new WebRTCManager();

// Global helper functions for compatibility
function addMemberToDom(userId, displayName) {
    let membersWrapper = document.getElementById('member__list')
    let memberItem = `<div class="member__wrapper" id="member__${userId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${displayName}</p>
                    </div>`

    membersWrapper.insertAdjacentHTML('beforeend', memberItem)
}

function removeMemberFromDom(userId) {
    let memberWrapper = document.getElementById(`member__${userId}__wrapper`)
    if (memberWrapper) {
        memberWrapper.remove()
    }
}

function addMessageToDom(name, message) {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}

function addBotMessageToDom(botMessage) {
    let messagesWrapper = document.getElementById('messages')

    let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Mumble Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
                        </div>
                    </div>`

    messagesWrapper.insertAdjacentHTML('beforeend', newMessage)

    let lastMessage = document.querySelector('#messages .message__wrapper:last-child')
    if(lastMessage){
        lastMessage.scrollIntoView()
    }
}
