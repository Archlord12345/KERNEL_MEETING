import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import TimerIcon from '@mui/icons-material/Timer';
import GroupIcon from '@mui/icons-material/Group';
import SendIcon from '@mui/icons-material/Send';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import VideoGrid from '../components/meeting/VideoGrid.jsx';
import { useMeeting } from '../hooks/useMeeting.js';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

const MeetingPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const hostMode = searchParams.get('host') === 'true';

  const {
    participants,
    messages,
    localStream,
    muted,
    videoOff,
    sharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    leaveMeeting,
    remoteStreamsRef,
  } = useMeeting({ roomId, isHost: hostMode });

  const [chatOpen, setChatOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [meetingStart] = useState(new Date());
  const localVideoRef = useRef(null);

  useEffect(() => {
    document.title = `Réunion ${roomId} - KERNEL MEETING`;
  }, [roomId]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage('');
  };

  const stats = useMemo(
    () => [
      {
        icon: <SignalCellularAltIcon color="success" />,
        label: 'Qualité réseau',
        value: 'Excellente',
      },
      {
        icon: <GroupIcon color="primary" />,
        label: 'Participants',
        value: `${Math.max(participants.length - 1, 0)} en ligne`,
      },
      {
        icon: <TimerIcon color="secondary" />,
        label: 'Durée',
        value: dayjs(meetingStart).fromNow(true),
      },
    ],
    [participants.length, meetingStart],
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={chatOpen ? 8 : 12}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src="/logo_sans-fond.png" alt="logo" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  KERNEL MEETING • SALLE {roomId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {hostMode ? 'Hôte connecté' : 'Participant connecté'}
                </Typography>
              </Box>
              <Box flexGrow={1} />
              <Tooltip title="Paramètres">
                <IconButton>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chat">
                <IconButton onClick={() => setChatOpen((prev) => !prev)}>
                  <ChatIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Card>

          <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <VideoGrid
              localStream={localStream}
              participants={participants}
              remoteStreamsRef={remoteStreamsRef}
              localVideoRef={localVideoRef}
            />

            <Stack direction="row" spacing={2} justifyContent="center">
              <IconButton
                onClick={toggleMute}
                sx={{ bgcolor: muted ? 'error.main' : 'primary.main', color: 'common.white' }}
              >
                {muted ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
              <IconButton
                onClick={toggleVideo}
                sx={{ bgcolor: videoOff ? 'error.main' : 'primary.main', color: 'common.white' }}
              >
                {videoOff ? <VideocamOffIcon /> : <VideocamIcon />}
              </IconButton>
              <IconButton
                onClick={toggleScreenShare}
                sx={{ bgcolor: sharing ? 'success.main' : 'primary.main', color: 'common.white' }}
              >
                {sharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
              <IconButton sx={{ bgcolor: 'error.main', color: 'common.white' }} onClick={leaveMeeting}>
                <CallEndIcon />
              </IconButton>
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Statistiques de la réunion
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {stats.map((stat) => (
                <Card key={stat.label} sx={{ flex: 1, p: 2 }} variant="outlined">
                  <Stack direction="row" spacing={2} alignItems="center">
                    {stat.icon}
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Grid>

      {chatOpen && (
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Stack spacing={3} sx={{ height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar>
                    <ChatIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Chat de réunion
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Discutez avec les participants en temps réel.
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 360 }}>
                  <List disablePadding>
                    {messages.map((item, index) => (
                      <ListItem key={`${item.timestamp}-${index}`} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            {item.sender.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2" fontWeight={600}>
                                {item.sender}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(item.timestamp).format('HH:mm')}
                              </Typography>
                            </Stack>
                          }
                          secondary={item.message}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Divider />
                <Box component="form" onSubmit={handleSendMessage}>
                  <TextField
                    fullWidth
                    placeholder="Écrire un message..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    InputProps={{
                      endAdornment: (
                        <IconButton type="submit" color="primary">
                          <SendIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Box>
              </Stack>
            </Card>

            <Card sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar>
                    <MeetingRoomIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Infos salle
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Code: {roomId}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Partagez ce code avec vos invités pour qu’ils rejoignent la réunion.
                </Typography>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      )}
    </Grid>
  );
};

export default MeetingPage;
