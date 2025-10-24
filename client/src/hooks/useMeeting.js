import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useMeeting = ({ roomId, isHost }) => {
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [memberCount, setMemberCount] = useState(1);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const remoteStreamsRef = useRef({});
  const joinedAtRef = useRef(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
        if (!cancelled) {
          setLocalStream(stream);
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      })
      .catch((error) => {
        console.error('Impossible d\'accéder aux médias :', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cleanUpMeeting = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    Object.values(remoteStreamsRef.current).forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    remoteStreamsRef.current = {};
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
  }, [localStream, screenStream]);

  useEffect(() => {
    if (!roomId) {
      return () => {};
    }

    const socket = connectSocket();
    socketRef.current = socket;

    const joinPayload = {
      roomId,
      isHost,
      userInfo: {
        name: 'Utilisateur',
        joinedAt: new Date().toISOString(),
      },
    };
    socket.emit('join-room', joinPayload);

    const handleUserJoined = async (data) => {
      setParticipants((prev) => {
        const exists = prev.some((participant) => participant.id === data.userId);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: data.userId,
            name: data.userInfo?.name || 'Participant',
            joinedAt: data.joinedAt || new Date().toISOString(),
            shouldCreateOffer: data.shouldCreateOffer,
          },
        ];
      });

      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current[data.userId] = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            roomId,
            targetId: data.userId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        remoteStreamsRef.current[data.userId] = event.streams[0];
        setParticipants((prev) =>
          prev.map((participant) =>
            participant.id === data.userId
              ? { ...participant, stream: event.streams[0] }
              : participant,
          ),
        );
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      if (data.shouldCreateOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', {
          roomId,
          targetId: data.userId,
          offer,
        });
      }
    };

    const handleUserLeft = (data) => {
      const { userId } = data;
      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close();
        delete peerConnectionsRef.current[userId];
      }
      if (remoteStreamsRef.current[userId]) {
        remoteStreamsRef.current[userId].getTracks().forEach((track) => track.stop());
        delete remoteStreamsRef.current[userId];
      }
      setParticipants((prev) => prev.filter((participant) => participant.id !== userId));
    };

    const handleRoomMembers = (members) => {
      setParticipants(
        members.map((member) => ({
          id: member.userId,
          name: member.displayName || 'Participant',
          joinedAt: member.joinedAt || new Date().toISOString(),
          stream: remoteStreamsRef.current[member.userId],
        })),
      );
      setMemberCount(members.length + 1);
    };

    const handleOffer = async (data) => {
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current[data.fromId] = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            roomId,
            targetId: data.fromId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        remoteStreamsRef.current[data.fromId] = event.streams[0];
        setParticipants((prev) =>
          prev.map((participant) =>
            participant.id === data.fromId
              ? { ...participant, stream: event.streams[0] }
              : participant,
          ),
        );
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', {
        roomId,
        targetId: data.fromId,
        answer,
      });
    };

    const handleAnswer = async (data) => {
      const peerConnection = peerConnectionsRef.current[data.fromId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    };

    const handleIceCandidate = async (data) => {
      const peerConnection = peerConnectionsRef.current[data.fromId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
      }
    };

    const handleChatMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('chat-message', handleChatMessage);
    socket.on('room-members', handleRoomMembers);
    socket.on('member-count', (count) => {
      setMemberCount(count);
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('chat-message', handleChatMessage);
      socket.off('room-members', handleRoomMembers);
      socket.off('member-count');
      cleanUpMeeting();
      disconnectSocket();
    };
  }, [roomId, isHost, localStream, cleanUpMeeting]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOff(!videoTrack.enabled);
    }
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (!sharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setSharing(true);

        const videoTrack = stream.getVideoTracks()[0];
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        stream.getVideoTracks()[0].onended = () => {
          setSharing(false);
          toggleScreenShare();
        };
      } catch (error) {
        console.error('Partage écran impossible', error);
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      setScreenStream(null);
      setSharing(false);
    }
  }, [sharing, screenStream, localStream]);

  const sendMessage = useCallback(
    (content) => {
      if (!content.trim() || !socketRef.current) return;
      const payload = {
        roomId,
        message: content,
        sender: 'Vous',
        timestamp: new Date().toISOString(),
      };
      socketRef.current.emit('chat-message', payload);
      setMessages((prev) => [...prev, payload]);
    },
    [roomId],
  );

  const leaveMeeting = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId });
    }
    cleanUpMeeting();
  }, [cleanUpMeeting, roomId]);

  const participantsWithLocal = useMemo(() => {
    const localParticipant = {
      id: 'local',
      name: 'Vous',
      joinedAt: joinedAtRef.current,
      stream: localStream,
    };

    const remoteParticipants = participants.filter((participant) => participant.id !== 'local');

    return [localParticipant, ...remoteParticipants];
  }, [participants, localStream]);

  return {
    participants: participantsWithLocal,
    messages,
    localStream,
    muted,
    videoOff,
    sharing,
    memberCount,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    leaveMeeting,
    setMessages,
    setParticipants,
    remoteStreamsRef,
  };
};
