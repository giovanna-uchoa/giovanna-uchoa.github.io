import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stringifyFrontmatter } from './frontmatter'
import type { Subject } from './dataTypes'

vi.mock('./githubClient', () => {
  const store = new Map<string, { content: string; sha: string }>()
  let shaCounter = 0

  return {
    __reset: () => {
      store.clear()
      shaCounter = 0
    },
    __set: (path: string, content: string) => {
      shaCounter += 1
      store.set(path, { content, sha: `sha-${shaCounter}` })
    },
    __has: (path: string) => store.has(path),
    __contentOf: (path: string) => store.get(path)?.content,
    getRawFile: vi.fn(async (path: string) => store.get(path)?.content ?? null),
    getFileWithSha: vi.fn(async (path: string) => {
      const entry = store.get(path)
      return entry ? { content: entry.content, sha: entry.sha } : null
    }),
    putFile: vi.fn(async (path: string, content: string) => {
      shaCounter += 1
      const sha = `sha-${shaCounter}`
      store.set(path, { content, sha })
      return { sha }
    }),
    deleteFile: vi.fn(async (path: string) => {
      store.delete(path)
    }),
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mock = (await import('./githubClient')) as any
const { cmsApi, resetCmsCache } = await import('./cmsApi')

interface SeedPost {
  id: number
  title: string
  excerpt: string
  date: string
  timeSpent: string
  subjectId: string
  tags: string[]
  content?: string
}

function seedManifest(subjects: unknown[], posts: unknown[]) {
  mock.__set('content/manifest.json', JSON.stringify({ subjects, posts }))
}

function seedPostFile(post: SeedPost) {
  const { content, ...frontmatter } = post
  mock.__set(
    `content/posts/${post.id}.md`,
    stringifyFrontmatter(frontmatter, content ?? `Body for post ${post.id}`)
  )
}

beforeEach(() => {
  mock.__reset()
  resetCmsCache()
})

describe('cmsApi post id generation', () => {
  it('computes the next id as max(existing ids) + 1, tolerating gaps', async () => {
    const ids = [2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15]
    const posts = ids.map((id) => ({
      id,
      title: `Post ${id}`,
      excerpt: '',
      date: '2026/01/01',
      timeSpent: '1hr',
      subjectId: 'mac0470',
      tags: [],
    }))
    seedManifest([], posts)

    const created = await cmsApi.createPost({
      title: 'New post',
      excerpt: 'excerpt',
      content: 'content',
      date: '2026/07/02',
      timeSpent: '1hr',
      subjectId: 'mac0470',
      tags: [],
    })

    expect(created.id).toBe(16)
  })

  it('starts at 1 when there are no existing posts', async () => {
    seedManifest([], [])

    const created = await cmsApi.createPost({
      title: 'First post',
      excerpt: 'excerpt',
      content: 'content',
      date: '2026/07/02',
      timeSpent: '1hr',
      subjectId: 'mac0470',
      tags: [],
    })

    expect(created.id).toBe(1)
  })
})

describe('cmsApi subject delete cascade', () => {
  it('deletes all posts belonging to the subject and leaves other subjects untouched', async () => {
    const subjects = [
      { id: 'mac0470', title: 'Floss', description: '', overview: '', icon: null, blogEnabled: true, blogSectionTitle: 'Articles' },
      { id: 'mac0215', title: 'Research', description: '', overview: '', icon: null, blogEnabled: true, blogSectionTitle: 'Registros' },
    ]
    const posts = [
      { id: 2, title: 'A', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: [] },
      { id: 3, title: 'B', excerpt: '', date: '2026/01/02', timeSpent: '1hr', subjectId: 'mac0470', tags: [] },
      { id: 11, title: 'C', excerpt: '', date: '2026/01/03', timeSpent: '1hr', subjectId: 'mac0215', tags: [] },
    ]
    seedManifest(subjects, posts)
    posts.forEach(seedPostFile)
    mock.__set('content/subjects/mac0470.md', stringifyFrontmatter({ title: 'Floss' }, ''))
    mock.__set('content/subjects/mac0215.md', stringifyFrontmatter({ title: 'Research' }, ''))

    await cmsApi.deleteSubject('mac0470')

    expect(mock.__has('content/posts/2.md')).toBe(false)
    expect(mock.__has('content/posts/3.md')).toBe(false)
    expect(mock.__has('content/posts/11.md')).toBe(true)
    expect(mock.__has('content/subjects/mac0470.md')).toBe(false)

    const remainingPosts = await cmsApi.listPosts()
    expect(remainingPosts.map((p) => p.id)).toEqual([11])

    const remainingSubjects = await cmsApi.listSubjects()
    expect(remainingSubjects.map((s) => s.id)).toEqual(['mac0215'])
  })
})

describe('cmsApi tag rename', () => {
  it('rewrites every post carrying the tag and leaves other posts and other tags untouched', async () => {
    const posts: SeedPost[] = [
      { id: 2, title: 'A', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: ['floss', 'linux-kernel'] },
      { id: 3, title: 'B', excerpt: '', date: '2026/01/02', timeSpent: '1hr', subjectId: 'mac0470', tags: ['floss'] },
      { id: 4, title: 'C', excerpt: '', date: '2026/01/03', timeSpent: '1hr', subjectId: 'mac0470', tags: ['linux-kernel'] },
    ]
    seedManifest([], posts)
    posts.forEach(seedPostFile)

    const { updatedPostIds } = await cmsApi.renameTag('floss', 'open-source')

    expect(updatedPostIds.sort()).toEqual([2, 3])

    const allPosts = await cmsApi.listPosts()
    const byId = new Map(allPosts.map((p) => [p.id, p]))
    expect(byId.get(2)?.tags.sort()).toEqual(['linux-kernel', 'open-source'])
    expect(byId.get(3)?.tags).toEqual(['open-source'])
    expect(byId.get(4)?.tags).toEqual(['linux-kernel'])

    const post2 = await cmsApi.getPost('2')
    expect(post2?.tags.sort()).toEqual(['linux-kernel', 'open-source'])
  })
})

describe('cmsApi tag removal', () => {
  it('removes the tag from every post carrying it and leaves other tags untouched', async () => {
    const posts: SeedPost[] = [
      { id: 2, title: 'A', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: ['floss', 'linux-kernel'] },
      { id: 3, title: 'B', excerpt: '', date: '2026/01/02', timeSpent: '1hr', subjectId: 'mac0470', tags: ['floss'] },
      { id: 4, title: 'C', excerpt: '', date: '2026/01/03', timeSpent: '1hr', subjectId: 'mac0470', tags: ['linux-kernel'] },
    ]
    seedManifest([], posts)
    posts.forEach(seedPostFile)

    const { updatedPostIds } = await cmsApi.removeTag('floss')

    expect(updatedPostIds.sort()).toEqual([2, 3])

    const allPosts = await cmsApi.listPosts()
    const byId = new Map(allPosts.map((p) => [p.id, p]))
    expect(byId.get(2)?.tags).toEqual(['linux-kernel'])
    expect(byId.get(3)?.tags).toEqual([])
    expect(byId.get(4)?.tags).toEqual(['linux-kernel'])

    const tags = await cmsApi.listTags()
    expect(tags.map((t) => t.name)).toEqual(['linux-kernel'])
  })
})

describe('cmsApi subject CRUD', () => {
  const baseSubject: Subject = {
    id: 'mac0470',
    title: 'Floss',
    description: 'desc',
    overview: 'overview',
    icon: null,
    blogEnabled: true,
    blogSectionTitle: '',
  }

  it('creates a subject, rejecting a duplicate id', async () => {
    seedManifest([], [])

    const created = await cmsApi.createSubject(baseSubject)
    expect(created.blogSectionTitle).toBe('Articles & Experiments')

    const subjects = await cmsApi.listSubjects()
    expect(subjects.map((s) => s.id)).toEqual(['mac0470'])

    await expect(cmsApi.createSubject(baseSubject)).rejects.toThrow('already exists')
  })

  it('updates an existing subject in place', async () => {
    seedManifest([baseSubject], [])
    mock.__set('content/subjects/mac0470.md', stringifyFrontmatter({ title: 'Floss' }, ''))

    const updated = await cmsApi.updateSubject('mac0470', { ...baseSubject, title: 'Floss Dev' })
    expect(updated.title).toBe('Floss Dev')

    const subject = await cmsApi.getSubject('mac0470')
    expect(subject?.title).toBe('Floss Dev')
  })
})

describe('cmsApi post CRUD', () => {
  it('updates an existing post in place', async () => {
    const post: SeedPost = { id: 2, title: 'A', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: [] }
    seedManifest([], [post])
    seedPostFile(post)

    const updated = await cmsApi.updatePost(2, {
      title: 'A updated',
      excerpt: '',
      content: 'new content',
      date: '2026/01/01',
      timeSpent: '1hr',
      subjectId: 'mac0470',
      tags: [],
    })

    expect(updated.title).toBe('A updated')

    const fetched = await cmsApi.getPost('2')
    expect(fetched?.title).toBe('A updated')
    expect(fetched?.content).toBe('new content')
  })

  it('rejects an invalid date on update', async () => {
    const post: SeedPost = { id: 2, title: 'A', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: [] }
    seedManifest([], [post])
    seedPostFile(post)

    await expect(
      cmsApi.updatePost(2, {
        title: 'A',
        excerpt: '',
        content: '',
        date: 'not-a-date',
        timeSpent: '1hr',
        subjectId: 'mac0470',
        tags: [],
      })
    ).rejects.toThrow('Invalid post date')
  })

  it('deletes a post', async () => {
    const post: SeedPost = { id: 2, title: 'A', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: [] }
    seedManifest([], [post])
    seedPostFile(post)

    await cmsApi.deletePost(2)

    expect(mock.__has('content/posts/2.md')).toBe(false)
    const remaining = await cmsApi.listPosts()
    expect(remaining).toEqual([])
  })
})

describe('cmsApi read methods', () => {
  const subjects: Subject[] = [
    { id: 'mac0470', title: 'Floss', description: '', overview: '', icon: null, blogEnabled: true, blogSectionTitle: 'Articles' },
  ]
  const posts: SeedPost[] = [
    { id: 2, title: 'A', excerpt: '', date: '2026/01/02', timeSpent: '1hr', subjectId: 'mac0470', tags: ['floss'] },
    { id: 3, title: 'B', excerpt: '', date: '2026/01/01', timeSpent: '1hr', subjectId: 'mac0470', tags: ['floss', 'linux-kernel'] },
  ]

  beforeEach(() => {
    seedManifest(subjects, posts)
    posts.forEach(seedPostFile)
  })

  it('lists subjects and posts by subject id', async () => {
    expect((await cmsApi.listSubjects()).map((s) => s.id)).toEqual(['mac0470'])
    expect((await cmsApi.listPostsBySubjectId('mac0470')).map((p) => p.id)).toEqual([2, 3])
    expect(await cmsApi.listPostsBySubjectId('unknown')).toEqual([])
  })

  it('lists posts sorted oldest first with empty content', async () => {
    const listed = await cmsApi.listPosts()
    expect(listed.map((p) => p.id)).toEqual([3, 2])
    expect(listed[0].content).toBe('')
  })

  it('gets a single subject or null for a missing one', async () => {
    expect((await cmsApi.getSubject('mac0470'))?.title).toBe('Floss')
    expect(await cmsApi.getSubject('missing')).toBeNull()
  })

  it('gets a post with full content, or null for an invalid id', async () => {
    const post = await cmsApi.getPost('2')
    expect(post?.title).toBe('A')
    expect(post?.content).toContain('Body for post 2')
    expect(await cmsApi.getPost('not-a-number')).toBeNull()
  })

  it('lists tags and tag summaries derived from post frontmatter', async () => {
    const tags = await cmsApi.listTags()
    expect(tags.map((t) => t.name)).toEqual(['floss', 'linux-kernel'])

    const summary = await cmsApi.listTagSummary()
    const bySlug = new Map(summary.map((s) => [s.slug, s.totalPosts]))
    expect(bySlug.get('floss')).toBe(2)
    expect(bySlug.get('linux-kernel')).toBe(1)
  })

  it('listAll returns the same aggregate data as the individual list methods', async () => {
    const snapshot = await cmsApi.listAll()
    expect(snapshot.subjects.map((s) => s.id)).toEqual(['mac0470'])
    expect(snapshot.posts.map((p) => p.id)).toEqual([3, 2])
    expect(snapshot.tags.map((t) => t.name)).toEqual(['floss', 'linux-kernel'])
    expect(snapshot.tagSummary.find((s) => s.slug === 'floss')?.totalPosts).toBe(2)
  })
})
