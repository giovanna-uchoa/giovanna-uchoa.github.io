import { Link as RouterLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

import { useLanguage } from '../../i18n/LanguageProvider';
import { monoFont } from '../../theme/muiTheme';
import { useCmsContent } from '../../utils/useCmsContent';
import {
  buildSubjectSummary,
  formatPostDate,
  getPostPath,
  sortPostsByDateDesc,
} from '../../utils/contentTaxonomy';

export const RIGHT_RAIL_WIDTH = 272;
// The rail only fits beside the sidebar and a readable column on wide screens.
export const RIGHT_RAIL_MIN_VIEWPORT = 1360;

function RailHeading({ children }: { children: string }) {
  return (
    <Typography
      variant="overline"
      component="h2"
      sx={{ color: 'text.secondary', lineHeight: 1.5 }}
    >
      {children}
    </Typography>
  );
}

const rowSx = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 0.25,
  py: 1.25,
  textDecoration: 'none',
  color: theme.palette.text.primary,
  borderTop: `1px solid ${theme.palette.divider}`,
  '&:hover': { color: theme.palette.primary.main },
});

function RightRail() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const { posts, subjects, tagSummary, loading } = useCmsContent();

  if (loading) return null;

  // The home feed already is the list of recent entries.
  const recent = pathname === '/' ? [] : sortPostsByDateDesc(posts).slice(0, 5);
  const subjectList = buildSubjectSummary(subjects, posts)
    .filter((subject) => subject.totalPosts > 0)
    .slice(0, 6);
  const tags = tagSummary.slice(0, 12);

  return (
    <Box
      component="aside"
      sx={{
        display: 'none',
        [`@media (min-width:${RIGHT_RAIL_MIN_VIEWPORT}px)`]: { display: 'block' },
        flexShrink: 0,
        width: RIGHT_RAIL_WIDTH,
        alignSelf: 'flex-start',
      }}
    >
      <Stack spacing={4}>
        {subjectList.length > 0 && (
          <Stack spacing={0.5} component="section">
            <RailHeading>{t('rail.subjects')}</RailHeading>
            <Box>
              {subjectList.map((subject) => (
                <Box key={subject.id} component={RouterLink} to={`/subjects/${subject.id}`} sx={rowSx}>
                  <Typography variant="caption" sx={{ fontFamily: monoFont, letterSpacing: '0.04em', color: 'primary.main' }}>
                    {subject.id.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">{subject.title}</Typography>
                </Box>
              ))}
              <Box component={RouterLink} to="/catalog" sx={(theme) => ({ ...rowSx(theme), borderBottom: `1px solid ${theme.palette.divider}` })}>
                <Typography variant="body2" color="text.secondary">
                  {t('rail.allSubjects')} →
                </Typography>
              </Box>
            </Box>
          </Stack>
        )}

        {recent.length > 0 && (
          <Stack spacing={0.5} component="section">
            <RailHeading>{t('rail.recent')}</RailHeading>
            <Box sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}` })}>
              {recent.map((post) => (
                <Box key={post.id} component={RouterLink} to={getPostPath(post)} sx={rowSx}>
                  <Typography variant="body2">{post.title}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
                    {formatPostDate(post.date)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        )}

        {tags.length > 0 && (
          <Stack spacing={1} component="section">
            <RailHeading>{t('rail.tags')}</RailHeading>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {tags.map((tag) => (
                <Chip
                  key={tag.slug}
                  size="small"
                  variant="outlined"
                  label={tag.label}
                  component={RouterLink}
                  to={`/tags/${tag.slug}`}
                  clickable
                />
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export default RightRail;
