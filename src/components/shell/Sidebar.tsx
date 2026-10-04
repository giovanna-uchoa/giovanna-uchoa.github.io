import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useLanguage } from '../../i18n/LanguageProvider';
import SocialLinks from '../ui/SocialLinks';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSwitch from './LanguageSwitch';
import ProfileAvatar from './ProfileAvatar';
import { isActiveRoute, useNavItems } from './useNavItems';

const appName = import.meta.env.VITE_APP_NAME ?? '';
const bio = import.meta.env.VITE_APP_BIO;

export const SIDEBAR_WIDTH = 280;

function Sidebar() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const navItems = useNavItems();

  return (
    <Box
      component="aside"
      sx={(theme) => ({
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
        width: SIDEBAR_WIDTH,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
        px: 3,
        py: 5,
        borderRight: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack spacing={1.5} component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
        <ProfileAvatar size={64} />
        <Typography variant="h5" component="p" sx={{ lineHeight: 1.2 }}>
          {appName}
        </Typography>
        {bio && (
          <Typography variant="body2" color="text.secondary">
            {bio}
          </Typography>
        )}
      </Stack>

      <Box component="nav" aria-label={t('shell.mainNav')}>
        <Stack spacing={0.5}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Button
                key={href}
                component={RouterLink}
                to={href}
                aria-current={active ? 'page' : undefined}
                startIcon={<Icon size={18} aria-hidden="true" />}
                sx={(theme) => ({
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1.25,
                  fontSize: '0.95rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? theme.palette.primary.main : theme.palette.text.primary,
                  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  },
                })}
              >
                {label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      <Stack
        spacing={1.5}
        sx={(theme) => ({ mt: 'auto', pt: 2.5, borderTop: `1px solid ${theme.palette.divider}` })}
      >
        <SocialLinks />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <LanguageSwitch />
          <ThemeToggle />
        </Stack>
      </Stack>
    </Box>
  );
}

export default Sidebar;
