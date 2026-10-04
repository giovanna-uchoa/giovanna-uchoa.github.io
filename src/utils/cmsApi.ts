import type { Language, Post, Subject, Tag, TagSummary } from './dataTypes'
import { getRawFile, getFileWithSha, putFile, deleteFile } from './githubClient'
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter'
import { normalizePostDate, getPostDate, toTagSlug, dedupeTags } from './contentTaxonomy'

const MANIFEST_PATH = 'content/manifest.json'
const DEFAULT_BLOG_SECTION_TITLE = 'Articles & Experiments'

type PostSummary = Omit<Post, 'content'>

interface Manifest {
  subjects: Subject[]
  posts: PostSummary[]
}

interface PostFrontmatter {
  id: number
  title: string
  excerpt: string
  date: string
  timeSpent: string
  subjectId: string
  tags: string[]
  lang?: Language
}

interface SubjectFrontmatter {
  title: string
  description: string
  icon: string | null
  blogEnabled: boolean
  blogSectionTitle: string
}

function normalizeBlogSectionTitle(value: string | null | undefined): string {
  const cleaned = value?.trim() ?? ''
  return cleaned || DEFAULT_BLOG_SECTION_TITLE
}

function postSummary(post: Post): PostSummary {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    timeSpent: post.timeSpent,
    subjectId: post.subjectId,
    tags: post.tags,
    ...(post.lang ? { lang: post.lang } : {}),
  }
}

function toPostWithEmptyContent(summary: PostSummary): Post {
  return { ...summary, content: '' }
}

function toPostFrontmatter(post: Post): PostFrontmatter {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    date: post.date,
    timeSpent: post.timeSpent,
    subjectId: post.subjectId,
    tags: post.tags,
    ...(post.lang ? { lang: post.lang } : {}),
  }
}

function toSubjectFrontmatter(subject: Subject): SubjectFrontmatter {
  return {
    title: subject.title,
    description: subject.description,
    icon: subject.icon ?? null,
    blogEnabled: subject.blogEnabled,
    blogSectionTitle: subject.blogSectionTitle,
  }
}

function postFilePath(id: number): string {
  return `content/posts/${id}.md`
}

function subjectFilePath(id: string): string {
  return `content/subjects/${id}.md`
}

// Several components (page + shell rail) read the manifest on the same load, so share
// one fetch. Writes and `resetCmsCache` drop it; a failed read is not cached.
let manifestRead: Promise<Manifest> | null = null

export function resetCmsCache(): void {
  manifestRead = null
}

function readManifest(): Promise<Manifest> {
  if (!manifestRead) {
    manifestRead = getRawFile(MANIFEST_PATH)
      .then((raw) => (raw ? (JSON.parse(raw) as Manifest) : { subjects: [], posts: [] }))
      .catch((error) => {
        manifestRead = null
        throw error
      })
  }
  return manifestRead
}

async function readManifestForWrite(): Promise<{ manifest: Manifest; sha: string | undefined }> {
  const file = await getFileWithSha(MANIFEST_PATH)
  if (!file) return { manifest: { subjects: [], posts: [] }, sha: undefined }
  return { manifest: JSON.parse(file.content) as Manifest, sha: file.sha }
}

async function writeManifest(
  manifest: Manifest,
  sha: string | undefined,
  message: string
): Promise<void> {
  manifestRead = null
  await putFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, message, sha)
}

async function readPostFile(id: number): Promise<Post | null> {
  const raw = await getRawFile(postFilePath(id))
  if (!raw) return null

  const { data, content } = parseFrontmatter<PostFrontmatter>(raw)
  return {
    id: data.id,
    title: data.title,
    excerpt: data.excerpt,
    content,
    date: normalizePostDate(data.date) ?? data.date,
    timeSpent: data.timeSpent,
    subjectId: data.subjectId,
    tags: dedupeTags(data.tags),
    ...(data.lang === 'pt' || data.lang === 'en' ? { lang: data.lang } : {}),
  }
}

function computeNextPostId(manifest: Manifest): number {
  return manifest.posts.reduce((max, post) => Math.max(max, post.id), 0) + 1
}

function countTagOccurrences(posts: PostSummary[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return counts
}

export interface CmsSnapshot {
  subjects: Subject[]
  posts: Post[]
  tags: Tag[]
  tagSummary: TagSummary[]
}

export const cmsApi = {
  // =========================
  // READ (public)
  // =========================

  async listSubjects(): Promise<Subject[]> {
    const manifest = await readManifest()
    return manifest.subjects
  },

  async getSubject(subjectId: string): Promise<Subject | null> {
    const manifest = await readManifest()
    return manifest.subjects.find((subject) => subject.id === subjectId) ?? null
  },

  async listPosts(): Promise<Post[]> {
    const manifest = await readManifest()
    return manifest.posts
      .map(toPostWithEmptyContent)
      .sort((a, b) => getPostDate(a).getTime() - getPostDate(b).getTime())
  },

  async listPostsBySubjectId(subjectId: string): Promise<Post[]> {
    const manifest = await readManifest()
    return manifest.posts
      .filter((post) => post.subjectId === subjectId)
      .map(toPostWithEmptyContent)
      .sort((a, b) => a.id - b.id)
  },

  async getPost(postId: string): Promise<Post | null> {
    const id = Number(postId)
    if (!Number.isInteger(id)) return null
    return readPostFile(id)
  },

  async listTags(): Promise<Tag[]> {
    const manifest = await readManifest()
    const counts = countTagOccurrences(manifest.posts)

    return [...counts.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, slug: toTagSlug(name) }))
  },

  async listTagSummary(): Promise<TagSummary[]> {
    const manifest = await readManifest()
    const counts = countTagOccurrences(manifest.posts)

    return [...counts.entries()]
      .map(([name, totalPosts]) => ({ slug: toTagSlug(name), label: name, totalPosts }))
      .sort((a, b) => b.totalPosts - a.totalPosts || a.label.localeCompare(b.label))
  },

  async listAll(): Promise<CmsSnapshot> {
    const manifest = await readManifest()
    const counts = countTagOccurrences(manifest.posts)

    const posts = manifest.posts
      .map(toPostWithEmptyContent)
      .sort((a, b) => getPostDate(a).getTime() - getPostDate(b).getTime())

    const tags = [...counts.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, slug: toTagSlug(name) }))

    const tagSummary = [...counts.entries()]
      .map(([name, totalPosts]) => ({ slug: toTagSlug(name), label: name, totalPosts }))
      .sort((a, b) => b.totalPosts - a.totalPosts || a.label.localeCompare(b.label))

    return { subjects: manifest.subjects, posts, tags, tagSummary }
  },

  // =========================
  // SUBJECTS (admin only)
  // =========================

  async createSubject(subject: Subject): Promise<Subject> {
    const { manifest, sha } = await readManifestForWrite()

    if (manifest.subjects.some((existing) => existing.id === subject.id)) {
      throw new Error(`Subject "${subject.id}" already exists.`)
    }

    const normalized: Subject = {
      ...subject,
      icon: subject.icon?.trim() || null,
      blogSectionTitle: normalizeBlogSectionTitle(subject.blogSectionTitle),
    }

    await putFile(
      subjectFilePath(normalized.id),
      stringifyFrontmatter(toSubjectFrontmatter(normalized), normalized.overview),
      `Create subject: ${normalized.title}`
    )

    manifest.subjects.push(normalized)
    await writeManifest(manifest, sha, `Update manifest: add subject ${normalized.id}`)

    return normalized
  },

  async updateSubject(subjectId: string, subject: Omit<Subject, 'id'>): Promise<Subject> {
    const normalized: Subject = {
      ...subject,
      id: subjectId,
      icon: subject.icon?.trim() || null,
      blogSectionTitle: normalizeBlogSectionTitle(subject.blogSectionTitle),
    }

    const existingFile = await getFileWithSha(subjectFilePath(subjectId))
    await putFile(
      subjectFilePath(subjectId),
      stringifyFrontmatter(toSubjectFrontmatter(normalized), normalized.overview),
      `Update subject: ${normalized.title}`,
      existingFile?.sha
    )

    const { manifest, sha } = await readManifestForWrite()
    const index = manifest.subjects.findIndex((existing) => existing.id === subjectId)
    if (index === -1) manifest.subjects.push(normalized)
    else manifest.subjects[index] = normalized

    await writeManifest(manifest, sha, `Update manifest: update subject ${subjectId}`)

    return normalized
  },

  async deleteSubject(subjectId: string): Promise<{ ok: boolean }> {
    const { manifest, sha } = await readManifestForWrite()
    const postsToDelete = manifest.posts.filter((post) => post.subjectId === subjectId)

    for (const post of postsToDelete) {
      const file = await getFileWithSha(postFilePath(post.id))
      if (file) {
        await deleteFile(
          postFilePath(post.id),
          file.sha,
          `Delete post ${post.id} (cascade from subject ${subjectId})`
        )
      }
    }

    const subjectFile = await getFileWithSha(subjectFilePath(subjectId))
    if (subjectFile) {
      await deleteFile(subjectFilePath(subjectId), subjectFile.sha, `Delete subject ${subjectId}`)
    }

    manifest.subjects = manifest.subjects.filter((subject) => subject.id !== subjectId)
    manifest.posts = manifest.posts.filter((post) => post.subjectId !== subjectId)

    await writeManifest(
      manifest,
      sha,
      `Update manifest: delete subject ${subjectId} and ${postsToDelete.length} post(s)`
    )

    return { ok: true }
  },

  // =========================
  // POSTS (admin only)
  // =========================

  async createPost(post: Omit<Post, 'id'>): Promise<Post> {
    const normalizedDate = normalizePostDate(post.date)
    if (!normalizedDate) {
      throw new Error('Invalid post date. Use yyyy/mm/dd.')
    }

    const { manifest, sha } = await readManifestForWrite()
    const id = computeNextPostId(manifest)

    const fullPost: Post = {
      ...post,
      id,
      date: normalizedDate,
      tags: dedupeTags(post.tags),
    }

    await putFile(
      postFilePath(id),
      stringifyFrontmatter(toPostFrontmatter(fullPost), fullPost.content),
      `Create post: ${fullPost.title}`
    )

    manifest.posts.push(postSummary(fullPost))
    await writeManifest(manifest, sha, `Update manifest: add post ${id}`)

    return fullPost
  },

  async updatePost(postId: number, post: Omit<Post, 'id'>): Promise<Post> {
    const normalizedDate = normalizePostDate(post.date)
    if (!normalizedDate) {
      throw new Error('Invalid post date. Use yyyy/mm/dd.')
    }

    const fullPost: Post = {
      ...post,
      id: postId,
      date: normalizedDate,
      tags: dedupeTags(post.tags),
    }

    const existingFile = await getFileWithSha(postFilePath(postId))
    await putFile(
      postFilePath(postId),
      stringifyFrontmatter(toPostFrontmatter(fullPost), fullPost.content),
      `Update post: ${fullPost.title}`,
      existingFile?.sha
    )

    const { manifest, sha } = await readManifestForWrite()
    const index = manifest.posts.findIndex((existing) => existing.id === postId)
    const summary = postSummary(fullPost)
    if (index === -1) manifest.posts.push(summary)
    else manifest.posts[index] = summary

    await writeManifest(manifest, sha, `Update manifest: update post ${postId}`)

    return fullPost
  },

  async deletePost(postId: number): Promise<{ ok: boolean }> {
    const file = await getFileWithSha(postFilePath(postId))
    if (file) {
      await deleteFile(postFilePath(postId), file.sha, `Delete post ${postId}`)
    }

    const { manifest, sha } = await readManifestForWrite()
    manifest.posts = manifest.posts.filter((post) => post.id !== postId)
    await writeManifest(manifest, sha, `Update manifest: delete post ${postId}`)

    return { ok: true }
  },

  // =========================
  // TAGS (admin only)
  // Tags are derived from post frontmatter, not a standalone entity, so
  // "editing" a tag means rewriting every post that carries it.
  // =========================

  async renameTag(oldName: string, newName: string): Promise<{ updatedPostIds: number[] }> {
    const cleanedNewName = newName.trim()
    if (!cleanedNewName) {
      throw new Error('Tag name cannot be empty.')
    }

    const { manifest, sha } = await readManifestForWrite()
    const affected = manifest.posts.filter((post) => (post.tags ?? []).includes(oldName))

    const updatedPostIds = (await Promise.all(
      affected.map(async (summary) => {
        const full = await readPostFile(summary.id)
        if (!full) return null

        const updated: Post = {
          ...full,
          tags: dedupeTags(full.tags.map((tag) => (tag === oldName ? cleanedNewName : tag))),
        }

        const existingFile = await getFileWithSha(postFilePath(summary.id))
        await putFile(
          postFilePath(summary.id),
          stringifyFrontmatter(toPostFrontmatter(updated), updated.content),
          `Rename tag "${oldName}" to "${cleanedNewName}" on post ${summary.id}`,
          existingFile?.sha
        )

        return summary.id
      })
    )).filter((id): id is number => id !== null)

    manifest.posts = manifest.posts.map((post) =>
      (post.tags ?? []).includes(oldName)
        ? { ...post, tags: dedupeTags(post.tags.map((tag) => (tag === oldName ? cleanedNewName : tag))) }
        : post
    )

    await writeManifest(manifest, sha, `Update manifest: rename tag "${oldName}" to "${cleanedNewName}"`)

    return { updatedPostIds }
  },

  async removeTag(name: string): Promise<{ updatedPostIds: number[] }> {
    const { manifest, sha } = await readManifestForWrite()
    const affected = manifest.posts.filter((post) => (post.tags ?? []).includes(name))

    const updatedPostIds = (await Promise.all(
      affected.map(async (summary) => {
        const full = await readPostFile(summary.id)
        if (!full) return null

        const updated: Post = { ...full, tags: full.tags.filter((tag) => tag !== name) }

        const existingFile = await getFileWithSha(postFilePath(summary.id))
        await putFile(
          postFilePath(summary.id),
          stringifyFrontmatter(toPostFrontmatter(updated), updated.content),
          `Remove tag "${name}" from post ${summary.id}`,
          existingFile?.sha
        )

        return summary.id
      })
    )).filter((id): id is number => id !== null)

    manifest.posts = manifest.posts.map((post) =>
      (post.tags ?? []).includes(name)
        ? { ...post, tags: post.tags.filter((tag) => tag !== name) }
        : post
    )

    await writeManifest(manifest, sha, `Update manifest: remove tag "${name}"`)

    return { updatedPostIds }
  },
}
