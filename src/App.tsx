import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/ui/state/Loading';
import { getContentPalette } from './theme/muiTheme';
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_SUBJECTS_SEGMENT,
  ADMIN_POSTS_SEGMENT,
  ADMIN_TAGS_SEGMENT,
} from './pages/admin/adminSections';

const HomePage = lazy(() => import('./pages/HomePage'));
const SubjectPage = lazy(() => import('./pages/SubjectPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminSubjectsPage = lazy(() => import('./pages/admin/AdminSubjectsPage'));
const AdminPostsPage = lazy(() => import('./pages/admin/AdminPostsPage'));
const AdminTagsPage = lazy(() => import('./pages/admin/AdminTagsPage'));
const ArchivesPage = lazy(() => import('./pages/ArchivesPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const TagPage = lazy(() => import('./pages/TagPage'));
const PostPage = lazy(() => import('./pages/PostPage'));

export default function App() {
  const theme = useTheme();

  return (
    <BrowserRouter>
      <Box 
        sx={{
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header />
        <Container sx={{ flex: 1, py: { xs: 3, md: 4 }, maxWidth: '100vw' }}>
          <Box
            component="main"
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: { xs: 2, sm: 3, md: 4 },
              backgroundColor: theme.palette.background.paper,
              boxShadow: getContentPalette(theme.palette.mode).elevatedShadow,
            }}
          >
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/archives" element={<ArchivesPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/tags" element={<TagsPage />} />
                <Route path="/tags/:tagSlug" element={<TagPage />} />
                <Route path="/subjects/:subjectId" element={<SubjectPage />} />
                <Route path="/subjects/:subjectId/post/:postId" element={<PostPage />} />
                <Route path="/post/:postId" element={<PostPage />} />
                <Route path={ADMIN_DASHBOARD_PATH} element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path={ADMIN_SUBJECTS_SEGMENT} element={<AdminSubjectsPage />} />
                  <Route path={`${ADMIN_SUBJECTS_SEGMENT}/:subjectId`} element={<AdminSubjectsPage />} />
                  <Route path={ADMIN_POSTS_SEGMENT} element={<AdminPostsPage />} />
                  <Route path={`${ADMIN_POSTS_SEGMENT}/:postId`} element={<AdminPostsPage />} />
                  <Route path={ADMIN_TAGS_SEGMENT} element={<AdminTagsPage />} />
                  <Route path={`${ADMIN_TAGS_SEGMENT}/:tagSlug`} element={<AdminTagsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </Box>
        </Container>
        <Footer />
      </Box>
    </BrowserRouter>
  );
}
