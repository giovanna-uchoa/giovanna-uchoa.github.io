import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useCmsContent } from '../utils/useCmsContent';
import {
  buildSubjectSummary,
  sortPostsByDateDesc,
} from '../utils/contentTaxonomy';

import { RIGHT_RAIL_MIN_VIEWPORT } from '../components/shell/RightRail';
import Hero from '../components/Hero';
import AsyncBoundary from '../components/ui/state/AsyncBoundary';
import FeaturedTileGrid from '../components/ui/FeaturedTileGrid';
import BlogCard from '../components/blog/BlogCard';

function HomePage() {
  const { posts, subjects, tagSummary, loading, error } = useCmsContent();

  const orderedPosts = sortPostsByDateDesc(posts);
  const recentPosts = orderedPosts.slice(0, 6);
  const subjectSummary = buildSubjectSummary(subjects, posts).slice(0, 6);
  const tags = tagSummary.slice(0, 12);

  return (
    <AsyncBoundary loading={loading} error={error}>
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Hero />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '2fr 1fr',
              // the shell's right rail takes over the catalog and tag lists
              [`@media (min-width:${RIGHT_RAIL_MIN_VIEWPORT}px)`]: '1fr',
            },
            gap: { xs: 3, sm: 4, lg: 6 },
            width: '100%',
          }}
        >
          {/* Posts */}
          <Box>
            <Stack spacing={2.5}>
              <Typography variant="h5">Recent Entries</Typography>

              <FeaturedTileGrid
                items={recentPosts}
                keyFn={(post) => post.id}
                columns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
                autoRows={{ xs: 'auto', sm: 'minmax(200px, auto)' }}
                featuredSpan={{ column: 2 }}
                renderItem={(post, featured) => (
                  <BlogCard
                    post={post}
                    to={`post/${post.id}`}
                    featured={featured}
                  />
                )}
              />
            </Stack>
          </Box>

          {/* Side lists (the right rail shows these on wide screens) */}
          <Box sx={{ [`@media (min-width:${RIGHT_RAIL_MIN_VIEWPORT}px)`]: { display: 'none' } }}>
            <Stack spacing={4}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Catalog</Typography>

                {subjectSummary.map((subject) => (
                  <Box
                    key={subject.id}
                    component={RouterLink}
                    to={`/subjects/${subject.id}`}
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'text.secondary',
                      '&:hover': { color: 'secondary.main' },
                    }}
                  >
                    <Typography variant="body2">
                      {subject.title}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="h6">Popular Tags</Typography>

                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag.slug}
                      size="small"
                      label={`${tag.label} (${tag.totalPosts})`}
                      component={RouterLink}
                      to={`/tags/${tag.slug}`}
                      clickable
                    />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </AsyncBoundary>
  );
}

export default HomePage;
