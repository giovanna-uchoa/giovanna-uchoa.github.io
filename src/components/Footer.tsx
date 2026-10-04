import { Terminal } from 'lucide-react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useLanguage } from '../i18n/LanguageProvider';

const appName = import.meta.env.VITE_APP_NAME;

function Footer() {
  const theme = useTheme();
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        mt: 'auto',
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Terminal size={16} />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                letterSpacing: 0.5,
              }}
            >
              {appName}
            </Typography>
          </Stack>

          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, opacity: 0.8 }}>
            © {year} {t('footer.rights')} · CC BY-NC 4.0
            <br />
            {t('footer.icon')} · The Noun Project (CC BY 3.0)
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;