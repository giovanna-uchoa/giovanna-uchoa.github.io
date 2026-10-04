import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { headingFont } from '../../theme/muiTheme';

import { useLanguage } from '../../i18n/LanguageProvider';
import SocialLinks from '../ui/SocialLinks';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageSwitch from './LanguageSwitch';
import ProfileAvatar from './ProfileAvatar';
import { isActiveRoute, useNavItems } from './useNavItems';

const appName = import.meta.env.VITE_APP_NAME ?? '';

function MobileBar() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const navItems = useNavItems();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={(theme) => ({
        display: { xs: 'block', md: 'none' },
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundImage: 'none',
      })}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Box
          component={RouterLink}
          to="/"
          onClick={close}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
        >
          <ProfileAvatar size={36} />
          <Typography noWrap sx={{ fontFamily: headingFont, fontWeight: 600, fontSize: '1rem' }}>
            {appName}
          </Typography>
        </Box>
        <LanguageSwitch />
        <ThemeToggle />
        <IconButton onClick={() => setOpen((prev) => !prev)} aria-label={t('shell.menu')} aria-expanded={open} sx={{ color: 'text.secondary' }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </IconButton>
      </Toolbar>

      <Drawer
        anchor="top"
        open={open}
        onClose={close}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': (theme) => ({
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        }}
      >
        <Box component="nav" aria-label={t('shell.mainNav')} sx={{ p: 3 }}>
          <Stack spacing={0.5}>
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = isActiveRoute(pathname, href);
              return (
                <Button
                  key={href}
                  component={RouterLink}
                  to={href}
                  onClick={close}
                  aria-current={active ? 'page' : undefined}
                  startIcon={<Icon size={18} aria-hidden="true" />}
                  sx={(theme) => ({
                    justifyContent: 'flex-start',
                    py: 1.25,
                    color: active ? theme.palette.primary.main : theme.palette.text.primary,
                    fontWeight: active ? 600 : 500,
                  })}
                >
                  {label}
                </Button>
              );
            })}
          </Stack>
          <SocialLinks sx={{ mt: 2 }} />
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default MobileBar;
