import { deepmerge } from '@mui/utils';
import { createTheme } from '@mui/material/styles';

const basePalette = {
  primary: {
    main: '#FF6B35',
    light: '#FF8C5F',
    dark: '#CC552A',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#00C851',
    light: '#33D46C',
    dark: '#00963E',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F7F9FC',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1C1C28',
    secondary: '#4B5563',
  },
};

const darkPaletteOverrides = {
  background: {
    default: '#0F172A',
    paper: '#111827',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5F5',
  },
};

const typography = {
  fontFamily: 'Inter, "Segoe UI", sans-serif',
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
  },
  h2: {
    fontWeight: 700,
    fontSize: '2rem',
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.75rem',
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.5rem',
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem',
  },
  button: {
    fontWeight: 600,
    textTransform: 'none',
  },
};

const components = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 12,
        paddingInline: 24,
        paddingBlock: 12,
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 18,
        border: '1px solid rgba(148, 163, 184, 0.15)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 18,
      },
    },
  },
};

const baseTheme = createTheme({
  palette: basePalette,
  typography,
  components,
});

export default baseTheme;
export const darkTheme = createTheme(
  deepmerge(baseTheme, { palette: darkPaletteOverrides }),
);
