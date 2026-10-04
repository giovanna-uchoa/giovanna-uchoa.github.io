import { SubmitEvent, useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { cmsApi } from '../../utils/cmsApi';
import type { Language, Post, Subject, Tag } from '../../utils/dataTypes';
import { formatAccessionNumber, normalizePostDate, sortPostsByDateDesc } from '../../utils/contentTaxonomy';
import { getErrorMessage } from '../../utils/errors';
import MarkdownEditor from './MarkdownEditor';
import ConfirmDialog from './ConfirmDialog';
import AdminListItem from './AdminListItem';
import SectionLabel from './SectionLabel';
import { useAdminCrudForm } from './useAdminCrudForm';

interface PostFormProps {
  posts: Post[];
  subjects: Subject[];
  tags: Tag[];
  reload: () => Promise<void>;
  setStatus: (status: string | null) => void;
  setStatusType: (type: 'success' | 'error') => void;
  initialEditValue?: number | null;
  onEditComplete?: () => void;
  registerDirty?: (dirty: boolean) => void;
}

interface PostFormState {
  title: string;
  excerpt: string;
  content: string;
  date: string;
  timeSpent: string;
  subjectId: string;
  selectedTags: string[];
  lang: Language | '';
}

const EMPTY_POST = {
  title: '',
  excerpt: '',
  content: '',
  date: '',
  timeSpent: '',
  subjectId: '',
  selectedTags: [] as string[],
  lang: '' as Language | '',
} satisfies PostFormState;

function PostForm({
  posts,
  subjects,
  tags,
  reload,
  setStatus,
  setStatusType,
  initialEditValue,
  onEditComplete,
  registerDirty,
}: PostFormProps) {
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const {
    form: postForm,
    setForm: setPostForm,
    isSubmitting,
    formRef,
    setBaseline,
    resetForm,
    runAction,
  } = useAdminCrudForm<PostFormState>({ initialValue: EMPTY_POST, registerDirty });

  const subjectById = useMemo(() => {
    return new Map(subjects.map(subject => [subject.id, subject]));
  }, [subjects]);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = posts.filter(post => {
      const matchesSearch = !term || post.title.toLowerCase().includes(term);
      const matchesSubject = subjectFilter === 'all' || post.subjectId === subjectFilter;
      return matchesSearch && matchesSubject;
    });
    return sortPostsByDateDesc(matches);
  }, [posts, search, subjectFilter]);

  useEffect(() => {
    if (initialEditValue != null) {
      handleEditPost(initialEditValue);
    }
  }, [initialEditValue]);

  const resetFormState = () => {
    setEditingPostId(null);
    resetForm();
  };

  const handlePostSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    const normalizedDate = normalizePostDate(postForm.date);
    if (!normalizedDate) {
      setStatusType('error');
      setStatus('Invalid date. Use yyyy/mm/dd.');
      return;
    }

    const payload: Omit<Post, 'id'> = {
      title: postForm.title,
      excerpt: postForm.excerpt,
      content: postForm.content,
      date: normalizedDate,
      timeSpent: postForm.timeSpent,
      subjectId: postForm.subjectId,
      tags: postForm.selectedTags,
      ...(postForm.lang ? { lang: postForm.lang } : {}),
    };

    const wasEditing = editingPostId !== null;

    const result = await runAction(
      () => (editingPostId ? cmsApi.updatePost(editingPostId, payload) : cmsApi.createPost(payload)),
      {
        onSuccess: () => `Post "${postForm.title}" ${editingPostId ? 'updated' : 'created'}.`,
        resetOnSuccess: resetFormState,
        fallbackErrorMessage: 'Post save failed',
        setStatus,
        setStatusType,
        reload,
      }
    );

    if (result && wasEditing) onEditComplete?.();
  };

  const handleEditPost = async (postId: number) => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatus(null);
    setEditLoadingId(postId);

    try {
      const fullPost = await cmsApi.getPost(String(postId));
      if (!fullPost) {
        setStatusType('error');
        setStatus('Post not found.');
        return;
      }

      const nextForm: PostFormState = {
        title: fullPost.title,
        excerpt: fullPost.excerpt,
        content: fullPost.content,
        date: normalizePostDate(fullPost.date) ?? fullPost.date,
        timeSpent: fullPost.timeSpent,
        subjectId: fullPost.subjectId,
        selectedTags: fullPost.tags ?? [],
        lang: fullPost.lang ?? '',
      };

      setEditingPostId(fullPost.id);
      setPostForm(nextForm);
      setBaseline(nextForm);
    } catch (err) {
      setStatusType('error');
      setStatus(getErrorMessage(err, 'Failed to load post'));
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleDeletePost = async (postId: number) => {
    const wasEditing = editingPostId === postId;

    const result = await runAction(() => cmsApi.deletePost(postId), {
      onSuccess: () => 'Post deleted.',
      resetOnSuccess: wasEditing ? resetFormState : undefined,
      fallbackErrorMessage: 'Delete failed',
      setStatus,
      setStatusType,
      reload,
    });

    if (result && wasEditing) onEditComplete?.();
  };

  const handleCancel = () => {
    resetFormState();
    onEditComplete?.();
  };

  return (
    <Paper ref={formRef} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Posts</Typography>

        <Box component="form" onSubmit={handlePostSubmit}>
          <Stack spacing={3}>
            <Stack spacing={2}>
              <SectionLabel>Details</SectionLabel>
              <TextField
                label="Title"
                value={postForm.title}
                onChange={event =>
                  setPostForm(prev => ({ ...prev, title: event.target.value }))
                }
                required
              />
              <TextField
                label="Excerpt"
                value={postForm.excerpt}
                onChange={event =>
                  setPostForm(prev => ({ ...prev, excerpt: event.target.value }))
                }
                required
              />
              <TextField
                select
                label="Subject"
                value={postForm.subjectId}
                onChange={event =>
                  setPostForm(prev => ({ ...prev, subjectId: event.target.value }))
                }
                required
              >
                {subjects.map(subject => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.title}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack spacing={2}>
              <SectionLabel>Metadata</SectionLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Date"
                  value={postForm.date}
                  onChange={event =>
                    setPostForm(prev => ({ ...prev, date: event.target.value }))
                  }
                  placeholder="yyyy/mm/dd"
                  helperText="Use yyyy/mm/dd"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '\\d{4}/\\d{2}/\\d{2}',
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Time Spent"
                  value={postForm.timeSpent}
                  onChange={event =>
                    setPostForm(prev => ({ ...prev, timeSpent: event.target.value }))
                  }
                />
                <TextField
                  select
                  fullWidth
                  label="Language"
                  value={postForm.lang}
                  onChange={event =>
                    setPostForm(prev => ({ ...prev, lang: event.target.value as Language | '' }))
                  }
                  helperText="Posts with no language show in both."
                >
                  <MenuItem value="">Not set</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </TextField>
              </Stack>
              <Autocomplete
                multiple
                options={tags.map((tag) => tag.name)}
                value={postForm.selectedTags}
                onChange={(_event, value) => {
                  setPostForm((prev) => ({ ...prev, selectedTags: value }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    helperText="Select one or more tags from the managed tag list."
                  />
                )}
              />
            </Stack>

            <Stack spacing={2}>
              <SectionLabel>Content</SectionLabel>
              <MarkdownEditor
                label="Content (Markdown only)"
                value={postForm.content}
                onChange={value =>
                  setPostForm(prev => ({ ...prev, content: value }))
                }
                minRows={8}
                required
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting && <CircularProgress size={16} sx={{ mr: 1 }} />}
                {editingPostId ? 'Update Post' : 'Create Post'}
              </Button>
              {editingPostId && (
                <Button variant="outlined" disabled={isSubmitting} onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        <Divider />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Search posts"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <TextField
            select
            size="small"
            label="Subject"
            value={subjectFilter}
            onChange={event => setSubjectFilter(event.target.value)}
            sx={{ minWidth: { sm: 220 } }}
          >
            <MenuItem value="all">All subjects</MenuItem>
            {subjects.map(subject => (
              <MenuItem key={subject.id} value={subject.id}>
                {subject.title}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack spacing={1.5}>
          {filteredPosts.map(post => (
            <AdminListItem
              key={post.id}
              eyebrow={`${formatAccessionNumber(post.id)} · ${subjectById.get(post.subjectId)?.title || post.subjectId}`}
              title={post.title}
              meta={
                post.tags.length > 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Tags: {post.tags.join(', ')}
                  </Typography>
                ) : undefined
              }
              actions={
                <>
                  <Button
                    size="small"
                    disabled={isSubmitting || editLoadingId === post.id}
                    onClick={() => handleEditPost(post.id)}
                  >
                    {editLoadingId === post.id ? <CircularProgress size={16} /> : 'Edit'}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => setConfirmDeletePostId(post.id)}
                  >
                    Delete
                  </Button>
                </>
              }
            />
          ))}
          {posts.length === 0 && (
            <Alert severity="info">No posts yet — create your first post above.</Alert>
          )}
          {posts.length > 0 && filteredPosts.length === 0 && (
            <Alert severity="info">No posts match your search.</Alert>
          )}
        </Stack>

        <ConfirmDialog
          open={confirmDeletePostId !== null}
          title="Delete post?"
          description="This will permanently delete this post. This cannot be undone."
          onConfirm={() => {
            const id = confirmDeletePostId;
            setConfirmDeletePostId(null);
            if (id !== null) handleDeletePost(id);
          }}
          onCancel={() => setConfirmDeletePostId(null)}
        />
      </Stack>
    </Paper>
  )
}

export default PostForm;
