import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import 'dayjs/locale/fr.js';
import { useMeetingsStore } from '../store/useMeetingsStore.js';
import { connectSocket, disconnectSocket } from '../services/socket.js';

const sampleRecentMeetings = [
  {
    id: 'ABC-DEF-GHI',
    title: "Réunion d'équipe",
    timestamp: Date.now() - 3600 * 1000,
  },
  {
    id: 'XYZ-123-HJK',
    title: 'Présentation client',
    timestamp: Date.now() - 2 * 3600 * 1000,
  },
  {
    id: 'PRO-456-PLN',
    title: 'Planification projet',
    timestamp: Date.now() - 24 * 3600 * 1000,
  },
];

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('fr');

const JoinMeetingPage = () => {
  const navigate = useNavigate();
  const initialize = useMeetingsStore((state) => state.initialize);
  const recentMeetings = useMeetingsStore((state) => state.recentMeetings);
  const addSearchHistory = useMeetingsStore((state) => state.addSearchHistory);
  const addRecentMeeting = useMeetingsStore((state) => state.addRecentMeeting);
  const searchHistory = useMeetingsStore((state) => state.searchHistory);
  const [meetingCode, setMeetingCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const socketRef = useRef(null);

  useEffect(() => {
    initialize();
    const socket = connectSocket();
    socketRef.current = socket;

    const handleJoined = ({ roomId }) => {
      setLoading(false);
      addRecentMeeting({ id: roomId, title: 'Réunion', timestamp: Date.now() });
      addSearchHistory({ code: roomId, title: 'Réunion', timestamp: Date.now() });
      navigate(`/meeting/${roomId}`);
    };

    const handleError = (payload) => {
      setLoading(false);
      setSnackbar({ open: true, message: payload?.message || 'Erreur de connexion', severity: 'error' });
    };

    socket.on('meeting-joined', handleJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('meeting-joined', handleJoined);
      socket.off('error', handleError);
      disconnectSocket();
    };
  }, [initialize, addRecentMeeting, addSearchHistory, navigate]);

  // Préremplir avec des exemples si pas d'historique
  const displayedRecents = useMemo(() => {
    if (recentMeetings.length === 0) {
      return sampleRecentMeetings;
    }
    return recentMeetings;
  }, [recentMeetings]);

  const handleJoin = () => {
    if (!meetingCode.trim()) {
      setError('Veuillez saisir un code de réunion.');
      return;
    }
    setError('');
    if (!socketRef.current) {
      setSnackbar({ open: true, message: 'Connexion serveur indisponible', severity: 'error' });
      return;
    }
    setLoading(true);
    socketRef.current.emit('join-meeting', {
      roomId: meetingCode.trim(),
    });
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const fakeCode = 'SCAN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setMeetingCode(fakeCode);
      setIsScanning(false);
    }, 2000);
  };

  const handleSelectRecent = (id) => {
    setMeetingCode(id);
    setError('');
  };

  const handleSelectHistory = (code) => {
    setMeetingCode(code);
    setError('');
  };

  return (
    <>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Typography variant="h5" fontWeight={700}>
                Rejoindre via code ou invitation
              </Typography>
              <TextField
                label="Code de réunion"
                placeholder="Ex: ABC-DEF-GHI"
                value={meetingCode}
                onChange={(event) => setMeetingCode(event.target.value.toUpperCase())}
                error={Boolean(error)}
                helperText={error || 'Utilisez le code fourni par l’organisateur.'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleScan} disabled={isScanning}>
                        <QrCodeScannerIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleJoin}
                  startIcon={<MeetingRoomIcon />}
                  disabled={meetingCode.trim().length === 0 || loading}
                >
                  {loading ? 'Connexion...' : 'Rejoindre la réunion'}
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleScan} disabled={isScanning}>
                  {isScanning ? 'Scan en cours...' : 'Scanner un QR code'}
                </Button>
              </Stack>
              <Divider flexItem>
                <Chip label="ou" variant="outlined" />
              </Divider>
              <Button
                variant="text"
                color="secondary"
                onClick={() => navigate('/create')}
                endIcon={<ArrowForwardIcon />}
              >
                Créer une nouvelle réunion
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={4}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar variant="rounded" sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                      <MeetingRoomIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Réunions récentes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Accédez rapidement aux dernières salles visitées.
                      </Typography>
                    </Box>
                  </Stack>
                  <List disablePadding>
                    {displayedRecents.map((meeting, index) => (
                      <Box key={meeting.id}>
                        {index !== 0 && <Divider component="li" />}
                        <ListItem button onClick={() => handleSelectRecent(meeting.id)}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                              {meeting.title.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={meeting.title}
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {meeting.id} • {dayjs(meeting.timestamp).fromNow()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <HistoryIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Historique de recherche
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Les codes utilisés récemment pour rejoindre des réunions.
                      </Typography>
                    </Box>
                  </Stack>
                  <List disablePadding>
                    {(searchHistory.length ? searchHistory : sampleRecentMeetings).map((item, index) => (
                      <Box key={item.code || item.id}>
                        {index !== 0 && <Divider component="li" />}
                        <ListItem button onClick={() => handleSelectHistory(item.code || item.id)}>
                          <ListItemText
                            primary={item.code || item.id}
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {dayjs(item.timestamp).fromNow()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default JoinMeetingPage;
