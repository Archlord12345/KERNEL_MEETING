import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import App from './App.jsx';
import { ColorModeProvider } from './theme/ColorModeProvider.jsx';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <BrowserRouter>
          <CssBaseline />
          <App />
        </BrowserRouter>
      </LocalizationProvider>
    </ColorModeProvider>
  </StrictMode>,
);
