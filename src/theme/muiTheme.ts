import { ThemeOptions } from '@mui/material/styles';

export const headingFont = ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'].join(',');
const bodyFont = ['"IBM Plex Sans"', '"Segoe UI"', '"Helvetica Neue"', 'sans-serif'].join(',');
export const monoFont = ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'].join(',');

export interface ContentPalette {
  markdownCodeBackground: string;
  markdownCodeText: string;
  markdownBlockquoteBorder: string;
  markdownBlockquoteBackground: string;
  elevatedShadow: string;
}

export function getContentPalette(mode: 'light' | 'dark'): ContentPalette {
  if (mode === 'dark') {
    return {
      markdownCodeBackground: '#1c2029',
      markdownCodeText: '#e8eaee',
      markdownBlockquoteBorder: '#8fa3ff',
      markdownBlockquoteBackground: '#1c2340',
      elevatedShadow: '0 8px 24px rgba(0,0,0,0.4)',
    };
  }

  return {
    markdownCodeBackground: '#eceef2',
    markdownCodeText: '#15181e',
    markdownBlockquoteBorder: '#2845d6',
    markdownBlockquoteBackground: '#e8ecfc',
    elevatedShadow: '0 1px 2px rgba(21,24,30,0.06), 0 8px 24px rgba(21,24,30,0.06)',
  };
}

const sharedTypography: ThemeOptions['typography'] = {
  fontFamily: bodyFont,
  h1: {
    fontFamily: headingFont,
    fontWeight: 600,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontFamily: headingFont,
    fontWeight: 600,
    lineHeight: 1.16,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: headingFont,
    fontWeight: 600,
    lineHeight: 1.2,
    fontSize: '1.75rem',
    '@media (min-width:600px)': { fontSize: '2.25rem' },
    '@media (min-width:900px)': { fontSize: '2.75rem' },
  },
  h4: {
    fontFamily: headingFont,
    fontWeight: 600,
    lineHeight: 1.25,
  },
  h5: {
    fontFamily: headingFont,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h6: {
    fontFamily: headingFont,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  body1: {
    lineHeight: 1.7,
  },
  body2: {
    lineHeight: 1.55,
  },
  overline: {
    fontFamily: monoFont,
    fontWeight: 500,
    letterSpacing: '0.06em',
  },
  button: {
    textTransform: 'none',
    fontWeight: 500,
  },
};

const lightDivider = '#e2e3e6';
const lightAccent = '#2845d6';
const darkDivider = '#262a33';
const darkAccent = '#8fa3ff';

function sharedComponents(mode: 'light' | 'dark'): ThemeOptions['components'] {
  const isLight = mode === 'light';

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: `1px solid ${isLight ? lightDivider : darkDivider}`,
          boxShadow: 'none',
          transition: 'border-color 0.2s ease',
          '&:hover': {
            borderColor: isLight ? lightAccent : darkAccent,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontFamily: monoFont,
          fontSize: '0.75rem',
        },
      },
    },
  };
}

export const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: lightAccent,
      light: '#5a73e6',
      dark: '#1b32a0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: lightAccent,
      light: '#5a73e6',
      dark: '#1b32a0',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f7f7f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#15181e',
      secondary: '#5a6070',
      disabled: '#8a90a0',
    },
    divider: lightDivider,
    mode: 'light',
  },
  typography: sharedTypography,
  components: sharedComponents('light'),
};

export const darkThemeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: darkAccent,
      light: '#b3c0ff',
      dark: '#6a80e6',
      contrastText: '#0e1014',
    },
    secondary: {
      main: darkAccent,
      light: '#b3c0ff',
      dark: '#6a80e6',
      contrastText: '#0e1014',
    },
    background: {
      default: '#0e1014',
      paper: '#161920',
    },
    text: {
      primary: '#e8eaee',
      secondary: '#a0a6b4',
      disabled: '#6b7180',
    },
    divider: darkDivider,
    mode: 'dark',
  },
  typography: sharedTypography,
  components: sharedComponents('dark'),
};
