import type { ArchiveGroup, Language, SubjectSummary, Post, Subject, Tag, TagSummary } from './dataTypes';

export function getPostPath(post: Pick<Post, 'id' | 'subjectId'>): string {
  return `/subjects/${post.subjectId}/post/${post.id}`;
}

interface PostDateParts {
  year: number;
  month: number;
  day: number;
}

function parsePostDateParts(value: string): PostDateParts | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const ymd = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!ymd) return null;

  const year = Number(ymd[1]);
  const month = Number(ymd[2]);
  const day = Number(ymd[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toYmdString(parts: PostDateParts, separator: '/' | '-'): string {
  return [
    String(parts.year).padStart(4, '0'),
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
  ].join(separator);
}

export function normalizePostDate(value: string): string | null {
  const parts = parsePostDateParts(value);
  if (!parts) return null;
  return toYmdString(parts, '/');
}

function parseDateToken(value: string): Date | null {
  const parts = parsePostDateParts(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function getPostDate(post: Post): Date {
  return parseDateToken(post.date) ?? new Date(0);
}

export function sortPostsByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => getPostDate(b).getTime() - getPostDate(a).getTime());
}

export function buildSubjectSummary(subjects: Subject[], posts: Post[]): SubjectSummary[] {
  const countBySubject = new Map<string, number>();
  for (const post of posts) {
    countBySubject.set(post.subjectId, (countBySubject.get(post.subjectId) ?? 0) + 1);
  }

  return subjects
    .map((subject) => ({
      id: subject.id,
      title: subject.title,
      description: subject.description,
      icon: subject.icon,
      totalPosts: subject.blogEnabled ? countBySubject.get(subject.id) ?? 0 : 0,
    }))
    .sort((a, b) => b.totalPosts - a.totalPosts || a.title.localeCompare(b.title));
}

function normalizeTag(rawTag: string): string {
  return rawTag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function dedupeTags(tags: string[] | undefined): string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

export function getPostTags(post: Post): string[] {
  return dedupeTags(post.tags);
}

export function buildPostTags(posts: Post[]): Record<number, string[]> {
  const index: Record<number, string[]> = {};

  for (const post of posts) {
    index[post.id] = getPostTags(post);
  }

  return index;
}

export function buildArchiveGroups(posts: Post[]): ArchiveGroup[] {
  const groups = new Map<string, ArchiveGroup>();

  for (const post of sortPostsByDateDesc(posts)) {
    const date = getPostDate(post);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    if (!groups.has(key)) {
      groups.set(key, {
        year,
        month,
        label: date.toLocaleString(undefined, {
          month: 'long',
          year: 'numeric',
        }),
        posts: [],
      });
    }

    groups.get(key)?.posts.push(post);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export function formatPostDate(value: string): string {
  const parsed = parseDateToken(value);
  if (!parsed) return normalizePostDate(value) ?? value;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

export function toTagSlug(value: string): string {
  return normalizeTag(value);
}

export interface MonthlyActivityPoint {
  year: number;
  month: number;
  count: number;
}

export function buildMonthlyActivity(posts: Post[], monthsBack = 12): MonthlyActivityPoint[] {
  const now = new Date();
  const points: MonthlyActivityPoint[] = [];

  for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    points.push({ year: date.getFullYear(), month: date.getMonth(), count: 0 });
  }

  const countByKey = new Map<string, number>();
  for (const post of posts) {
    const date = getPostDate(post);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
  }

  return points.map((point) => ({
    ...point,
    count: countByKey.get(`${point.year}-${point.month}`) ?? 0,
  }));
}

export function formatAccessionNumber(id: number): string {
  return `№${String(id).padStart(3, '0')}`;
}


// Posts without a `lang` are shown in every language.
export function filterPostsByLanguage<T extends Pick<Post, 'lang'>>(posts: T[], lang: Language): T[] {
  return posts.filter((post) => !post.lang || post.lang === lang);
}

function countTags(posts: Pick<Post, 'tags'>[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return counts;
}

export function buildTagList(posts: Pick<Post, 'tags'>[]): Tag[] {
  return [...countTags(posts).keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, slug: toTagSlug(name) }));
}

export function buildTagSummary(posts: Pick<Post, 'tags'>[]): TagSummary[] {
  return [...countTags(posts).entries()]
    .map(([name, totalPosts]) => ({ slug: toTagSlug(name), label: name, totalPosts }))
    .sort((a, b) => b.totalPosts - a.totalPosts || a.label.localeCompare(b.label));
}
