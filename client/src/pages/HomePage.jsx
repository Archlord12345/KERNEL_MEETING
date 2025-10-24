import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import RouterOutlinedIcon from '@mui/icons-material/RouterOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import { useNavigate } from 'react-router-dom';
import { getServerInfo } from '../services/api.js';

const features = [
  {
    title: 'Qualité haute définition',
    description: 'Flux vidéo 1080p avec optimisation automatique en fonction du réseau.',
    icon: <VideoCallOutlinedIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Sécurité renforcée',
    description: 'Chiffrement de bout en bout et protections avancées.',
    icon: <ShieldOutlinedIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Jusqu’à 250 participants',
    description: 'Gestion intelligente des intervenants et salles de sous-groupes.',
    icon: <GroupOutlinedIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Personnalisation totale',
    description: 'Thèmes, dispositions et contrôles adaptés à vos besoins.',
    icon: <SettingsOutlinedIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Ultra performant',
    description: 'Technologie WebRTC et réseau optimisé pour minimiser la latence.',
    icon: <SpeedOutlinedIcon fontSize="large" color="primary" />,
  },
  {
    title: 'Intégration facile',
    description: 'API et webhooks pour connecter vos outils métiers.',
    icon: <RouterOutlinedIcon fontSize="large" color="primary" />,
  },
];

const steps = [
  {
    label: 'Créer',
    description: 'Planifiez une réunion et définissez les paramètres en quelques clics.',
  },
  {
    label: 'Partager',
    description: 'Envoyez le lien sécurisé à vos invités ou intégrez-le à vos outils.',
  },
  {
    label: 'Collaborer',
    description: 'Partage d’écran, chat, notes en direct et enregistrement disponibles.',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState(null);
  const [copyState, setCopyState] = useState({ address: false, localhost: false });

  useEffect(() => {
    let mounted = true;
    getServerInfo()
      .then((info) => {
        if (mounted) setServerInfo(info);
      })
      .catch(() => {
        if (mounted) {
          setServerInfo({ address: 'Indisponible', localhost: 'localhost:3000' });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = async (type) => {
    try {
      const value = serverInfo?.[type] || 'localhost:3000';
      await navigator.clipboard.writeText(value);
      setCopyState((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => setCopyState((prev) => ({ ...prev, [type]: false })), 2000);
    } catch (error) {
      console.error('Copie impossible', error);
    }
  };

  return (
    <Stack spacing={6}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
          gap: 4,
          alignItems: 'center',
        }}
      >
        <Stack spacing={3}>
          <Chip label="Plateforme professionnelle" color="secondary" sx={{ alignSelf: 'flex-start' }} />
          <Typography variant="h2" fontWeight={700} color="text.primary">
            KERNEL MEETING
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Organisez vos réunions avec une expérience immersive, sécurisée et adaptée à vos équipes.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/join')}
            >
              Rejoindre une réunion
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={() => navigate('/create')}
            >
              Créer une réunion
            </Button>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src="/logo_sans-fond.png"
              alt="Logo"
              sx={{ width: 72, height: 72 }}
            />
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Serveur opérationnel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Prêt à accepter vos connexions sécurisées.
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <RouterOutlinedIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Adresse de connexion
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Partagez ces informations pour des connexions rapides.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Réseau local
                  </Typography>
                  <Typography variant="h6" fontFamily="'JetBrains Mono', monospace">
                    {serverInfo?.address || 'Chargement...'}
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  color={copyState.address ? 'success' : 'primary'}
                  startIcon={copyState.address ? <DoneIcon /> : <ContentCopyIcon />}
                  onClick={() => handleCopy('address')}
                >
                  {copyState.address ? 'Copié' : 'Copier'}
                </Button>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Localhost
                  </Typography>
                  <Typography variant="h6" fontFamily="'JetBrains Mono', monospace">
                    {serverInfo?.localhost || 'localhost:3000'}
                  </Typography>
                </Stack>
                <Button
                  variant="outlined"
                  color={copyState.localhost ? 'success' : 'secondary'}
                  startIcon={copyState.localhost ? <DoneIcon /> : <ContentCopyIcon />}
                  onClick={() => handleCopy('localhost')}
                >
                  {copyState.localhost ? 'Copié' : 'Copier'}
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Box>

      <Box>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Nos fonctionnalités
        </Typography>
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} lg={4} key={feature.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    {feature.icon}
                    <Typography variant="h6" fontWeight={700}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Card sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={700}>
            Démarrer rapidement avec KERNEL MEETING
          </Typography>
          <Grid container spacing={3}>
            {steps.map((step, index) => (
              <Grid item xs={12} md={4} key={step.label}>
                <Stack spacing={2}>
                  <Chip label={`Étape ${index + 1}`} color="primary" variant="outlined" />
                  <Typography variant="h6" fontWeight={600}>
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
          <Divider />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <Typography variant="body1" color="text.secondary">
              Besoin d’un accompagnement sur mesure ?
            </Typography>
            <Button variant="contained" color="secondary" size="large">
              Contacter l’équipe KERNEL MEETING
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
};

export default HomePage;
