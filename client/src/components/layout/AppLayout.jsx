import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useColorMode } from '../../theme/ColorModeContext.js';

const navLinks = [
  { to: '/', label: 'Accueil', icon: <VideoCallIcon fontSize="small" /> },
  { to: '/join', label: 'Rejoindre', icon: <MeetingRoomIcon fontSize="small" /> },
  { to: '/create', label: 'Créer', icon: <AddCircleIcon fontSize="small" /> },
];

const linkStyles = ({ isActive }) => ({
  textDecoration: 'none',
  color: isActive ? 'primary.main' : 'text.secondary',
  fontWeight: isActive ? 700 : 500,
});

const AppLayout = ({ children }) => {
  const { mode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = useMemo(() => {
    const link = navLinks.find((item) => item.to === location.pathname);
    switch (location.pathname) {
      case '/join':
        return 'Rejoindre une réunion';
      case '/create':
        return 'Créer une nouvelle réunion';
      default:
        return link ? link.label : 'KERNEL MEETING';
    }
  }, [location.pathname]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src="/logo_sans-fond.png"
                alt="Kernel Meeting Logo"
                sx={{ width: 42, height: 42, borderRadius: '50%' }}
              />
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  KERNEL MEETING
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Plateforme de vidéoconférence moderne
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} style={linkStyles}>
                  <Button
                    startIcon={link.icon}
                    color={location.pathname === link.to ? 'primary' : 'inherit'}
                    variant={location.pathname === link.to ? 'contained' : 'text'}
                    sx={{ borderRadius: 2 }}
                  >
                    {link.label}
                  </Button>
                </NavLink>
              ))}
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Changer de thème">
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/meeting/demo-room')}
              sx={{ borderRadius: 3 }}
            >
              Démarrer une réunion
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="xl" sx={{ py: 6 }}>
        <Typography variant="h3" fontWeight={700} mb={4} color="text.primary">
          {currentTitle}
        </Typography>
        {children}
      </Container>
    </Box>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node,
};

export default AppLayout;
