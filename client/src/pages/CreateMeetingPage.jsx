import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
  MenuItem,
  Chip,
  Slider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import { DesktopDatePicker, DesktopTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../services/socket.js';
import { useMeetingsStore } from '../store/useMeetingsStore.js';

const defaultMeeting = {
  title: '',
  description: '',
  date: dayjs().add(1, 'hour'),
  duration: 60,
  language: 'fr',
  passwordProtected: false,
  password: '',
  maxParticipants: 12,
  theme: 'light',
};

const CreateMeetingPage = () => {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(defaultMeeting);
  const [activeTab, setActiveTab] = useState('settings');
  const { addRecentMeeting } = useMeetingsStore();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'info', message: '' });
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const handleCreated = ({ roomId, meetingData }) => {
      setLoading(false);
      addRecentMeeting({
        id: roomId,
        title: meetingData?.title || meeting.title || 'Nouvelle réunion',
        timestamp: Date.now(),
      });
      navigate(`/meeting/${roomId}?host=true`);
    };

    const handleError = (payload) => {
      setLoading(false);
      setSnackbar({
        open: true,
        severity: 'error',
        message: payload?.message || 'Erreur lors de la création de la réunion',
      });
    };

    socket.on('meeting-created', handleCreated);
    socket.on('error', handleError);

    return () => {
      socket.off('meeting-created', handleCreated);
      socket.off('error', handleError);
    };
  }, [addRecentMeeting, navigate, meeting.title]);

  const handleChange = (field) => (event) => {
    let value = event.target?.value ?? event;
    if (field === 'duration' || field === 'maxParticipants') {
      value = Number(value);
    }
    setMeeting((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    if (!meeting.title.trim()) {
      setSnackbar({ open: true, severity: 'warning', message: 'Veuillez nommer votre réunion.' });
      return;
    }

    if (!socketRef.current) {
      setSnackbar({ open: true, severity: 'error', message: 'Connexion serveur indisponible.' });
      return;
    }

    setLoading(true);

    const payload = {
      title: meeting.title.trim(),
      description: meeting.description.trim(),
      date: meeting.date.format('YYYY-MM-DD'),
      time: meeting.date.format('HH:mm'),
      duration: meeting.duration,
      language: meeting.language,
      requirePassword: meeting.passwordProtected,
      password: meeting.password,
      maxParticipants: meeting.maxParticipants,
      theme: meeting.theme,
    };

    socketRef.current.emit('create-meeting', payload);
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={7}>
        <Card sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={700}>
              Configurer votre réunion
            </Typography>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab value="settings" label="Paramètres" />
              <Tab value="security" label="Sécurité" />
              <Tab value="participants" label="Participants" />
              <Tab value="appearance" label="Apparence" />
            </Tabs>

            {activeTab === 'settings' && (
              <Stack spacing={3}>
                <TextField
                  label="Titre de la réunion"
                  placeholder="Ex: Stratégie Q4"
                  value={meeting.title}
                  onChange={handleChange('title')}
                />
                <TextField
                  label="Description"
                  placeholder="Ajoutez un ordre du jour ou des notes"
                  value={meeting.description}
                  onChange={handleChange('description')}
                  multiline
                  minRows={3}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DesktopDatePicker
                      label="Date"
                      value={meeting.date}
                      onChange={handleChange('date')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DesktopTimePicker
                      label="Heure"
                      value={meeting.date}
                      onChange={handleChange('date')}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Durée"
                      value={meeting.duration}
                      onChange={handleChange('duration')}
                    >
                      {[30, 45, 60, 90, 120].map((duration) => (
                        <MenuItem key={duration} value={duration}>
                          {duration} minutes
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Langue"
                      value={meeting.language}
                      onChange={handleChange('language')}
                    >
                      <MenuItem value="fr">Français</MenuItem>
                      <MenuItem value="en">Anglais</MenuItem>
                      <MenuItem value="es">Espagnol</MenuItem>
                      <MenuItem value="de">Allemand</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {activeTab === 'security' && (
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <LockIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Sécuriser la réunion
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={meeting.passwordProtected}
                      onChange={(event) =>
                        setMeeting((prev) => ({
                          ...prev,
                          passwordProtected: event.target.checked,
                          password: event.target.checked ? prev.password : '',
                        }))
                      }
                    />
                  }
                  label="Activer la protection par mot de passe"
                />
                {meeting.passwordProtected && (
                  <TextField
                    label="Mot de passe"
                    placeholder="Choisissez un mot de passe sécurisé"
                    value={meeting.password}
                    onChange={handleChange('password')}
                    type="password"
                  />
                )}
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Les participants devront saisir ce mot de passe pour rejoindre la réunion.
                </Typography>
              </Stack>
            )}

            {activeTab === 'participants' && (
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <PeopleAltIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Gestion des participants
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Définissez le nombre maximum de participants autorisés.
                </Typography>
                <Slider
                  value={meeting.maxParticipants}
                  onChange={(_, value) => setMeeting((prev) => ({ ...prev, maxParticipants: value }))}
                  min={4}
                  max={250}
                  step={1}
                  valueLabelDisplay="auto"
                />
                <Chip label={`${meeting.maxParticipants} participants`} color="primary" />
              </Stack>
            )}

            {activeTab === 'appearance' && (
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <GTranslateIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Apparence de la salle
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Button
                    variant={meeting.theme === 'light' ? 'contained' : 'outlined'}
                    onClick={() => setMeeting((prev) => ({ ...prev, theme: 'light' }))}
                  >
                    Thème clair
                  </Button>
                  <Button
                    variant={meeting.theme === 'dark' ? 'contained' : 'outlined'}
                    onClick={() => setMeeting((prev) => ({ ...prev, theme: 'dark' }))}
                  >
                    Thème sombre
                  </Button>
                </Stack>
              </Stack>
            )}

            <Divider />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setMeeting(defaultMeeting)}>
                Réinitialiser
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer la réunion'}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Stack spacing={4}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Aperçu de la réunion
                </Typography>
                <List disablePadding>
                  <ListItem>
                    <ListItemText
                      primary="Titre"
                      secondary={meeting.title || 'Nouvelle réunion'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Date"
                      secondary={meeting.date.format('dddd D MMMM YYYY à HH:mm')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Durée"
                      secondary={`${meeting.duration} minutes`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Langue"
                      secondary={meeting.language.toUpperCase()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Participants"
                      secondary={`${meeting.maxParticipants} personnes maximum`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Sécurité"
                      secondary={meeting.passwordProtected ? 'Protégée par mot de passe' : 'Libre accès'}
                    />
                  </ListItem>
                </List>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Conseils d’organisation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Envoyez les invitations avec un ordre du jour clair.
                  {'\n'}• Testez votre micro et webcam avant le début.
                  {'\n'}• Utilisez les salles de sous-groupes pour des ateliers ciblés.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
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
    </Grid>
  );
};

export default CreateMeetingPage;
