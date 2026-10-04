import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';

import { useLanguage } from '../../i18n/LanguageProvider';
import { ADMIN_DASHBOARD_PATH } from '../../pages/admin/adminSections';
import Footer from '../Footer';
import MobileBar from './MobileBar';
import RightRail from './RightRail';
import Sidebar from './Sidebar';

const MAIN_ID = 'main-content';

function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const isAdmin = pathname === ADMIN_DASHBOARD_PATH || pathname.startsWith(`${ADMIN_DASHBOARD_PATH}/`);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      <Box
        component="a"
        href={`#${MAIN_ID}`}
        sx={(theme) => ({
          position: 'absolute',
          left: 8,
          top: -64,
          zIndex: theme.zIndex.tooltip,
          px: 2,
          py: 1,
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.primary.main,
          '&:focus': { top: 8 },
        })}
      >
        {t('shell.skip')}
      </Box>

      <Sidebar />
      <MobileBar />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: { md: 6 },
            px: { xs: 2, sm: 3, md: 6 },
            py: { xs: 3, md: 6 },
          }}
        >
          <Box
            component="main"
            id={MAIN_ID}
            tabIndex={-1}
            sx={{ flex: 1, minWidth: 0, maxWidth: isAdmin ? 1100 : 780, outline: 'none' }}
          >
            {children}
          </Box>
          {!isAdmin && <RightRail />}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}

export default AppShell;
