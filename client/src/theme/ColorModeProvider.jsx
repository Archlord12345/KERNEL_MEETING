import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import baseTheme from './theme.js';
import { ColorModeContext } from './ColorModeContext.js';

export const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => {
    const paletteOverrides = {
      palette: {
        mode,
      },
    };

    return createTheme(deepmerge(baseTheme, paletteOverrides));
  }, [mode]);

  const value = useMemo(() => ({ mode, toggleColorMode }), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};

ColorModeProvider.propTypes = {
  children: PropTypes.node,
};
