import { describe, expect, it } from 'vitest'
import {
  buildArchiveGroups,
  buildMonthlyActivity,
  buildSubjectSummary,
  buildTagList,
  buildTagSummary,
  dedupeTags,
  filterPostsByLanguage,
  formatAccessionNumber,
  formatPostDate,
  getPostDate,
  getPostPath,
  getPostTags,
  normalizePostDate,
  sortPostsByDateDesc,
  toTagSlug,
} from './contentTaxonomy'
import type { Post, Subject } from './dataTypes'

function makePost(overrides: Partial<Post>): Post {
  return {
    id: 1,
    title: 'Untitled',
    excerpt: '',
    content: '',
    date: '2026/01/01',
    timeSpent: '1hr',
    subjectId: 'mac0470',
    tags: [],
    ...overrides,
  }
}

describe('date helpers', () => {
  it.each([
    ['2026-02-28', '2026/02/28'],
    ['2026/07/02', '2026/07/02'],
    ['2026-03-31', '2026/03/31'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizePostDate(input)).toBe(expected)
  })

  it('rejects an invalid date', () => {
    expect(normalizePostDate('not-a-date')).toBeNull()
    expect(normalizePostDate('2026/13/40')).toBeNull()
  })
})

describe('sortPostsByDateDesc', () => {
  it('orders newest first using the real dump dates', () => {
    const posts = [
      makePost({ id: 2, date: '2026/02/28' }),
      makePost({ id: 15, date: '2026/07/02' }),
      makePost({ id: 11, date: '2026/03/31' }),
    ]

    expect(sortPostsByDateDesc(posts).map((p) => p.id)).toEqual([15, 11, 2])
  })
})

describe('buildArchiveGroups', () => {
  it('groups posts by year/month, newest group first', () => {
    const posts = [
      makePost({ id: 11, date: '2026/03/31' }),
      makePost({ id: 12, date: '2026/04/30' }),
      makePost({ id: 13, date: '2026/05/31' }),
      makePost({ id: 3, date: '2026/03/10' }),
    ]

    const groups = buildArchiveGroups(posts)

    expect(groups.map((g) => `${g.year}-${g.month}`)).toEqual(['2026-4', '2026-3', '2026-2'])
    const march = groups.find((g) => g.month === 2)
    expect(march?.posts.map((p) => p.id).sort((a, b) => a - b)).toEqual([3, 11])
  })
})

describe('buildSubjectSummary', () => {
  const subjects: Subject[] = [
    { id: 'mac0470', title: 'Floss', description: '', overview: '', icon: null, blogEnabled: true, blogSectionTitle: 'Articles' },
    { id: 'mac0500', title: 'TCC', description: '', overview: '', icon: null, blogEnabled: false, blogSectionTitle: 'Articles' },
  ]

  it('counts posts per subject and zeroes out subjects with blogEnabled=false', () => {
    const posts = [
      makePost({ id: 2, subjectId: 'mac0470' }),
      makePost({ id: 3, subjectId: 'mac0470' }),
      makePost({ id: 4, subjectId: 'mac0500' }),
    ]

    const summary = buildSubjectSummary(subjects, posts)
    const bySubject = new Map(summary.map((s) => [s.id, s.totalPosts]))

    expect(bySubject.get('mac0470')).toBe(2)
    expect(bySubject.get('mac0500')).toBe(0)
  })
})

describe('toTagSlug', () => {
  it('slugifies accented and mixed-case tag names', () => {
    expect(toTagSlug('Linux Kernel')).toBe('linux-kernel')
    expect(toTagSlug('Ciência Aberta')).toBe('ciencia-aberta')
  })
})

describe('getPostPath', () => {
  it('builds the subject-scoped post URL', () => {
    expect(getPostPath({ id: 15, subjectId: 'mac0470' })).toBe('/subjects/mac0470/post/15')
  })
})

describe('getPostDate', () => {
  it('parses a valid post date', () => {
    const date = getPostDate(makePost({ date: '2026/07/02' }))
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(2)
  })

  it('falls back to the epoch for an invalid date', () => {
    expect(getPostDate(makePost({ date: 'not-a-date' })).getTime()).toBe(0)
  })
})

describe('dedupeTags / getPostTags', () => {
  it('trims, dedupes, and drops empty tags', () => {
    expect(dedupeTags([' floss ', 'floss', '', '  '])).toEqual(['floss'])
    expect(dedupeTags(undefined)).toEqual([])
  })

  it('getPostTags applies the same normalization to a post', () => {
    expect(getPostTags(makePost({ tags: [' floss ', 'floss', 'linux-kernel'] }))).toEqual([
      'floss',
      'linux-kernel',
    ])
  })
})

describe('formatPostDate', () => {
  it('formats a valid date as a short human-readable string', () => {
    expect(formatPostDate('2026/07/02')).toMatch(/2026/)
  })

  it('falls back to the raw value for an invalid date', () => {
    expect(formatPostDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatAccessionNumber', () => {
  it('zero-pads the post id with a № prefix', () => {
    expect(formatAccessionNumber(5)).toBe('№005')
    expect(formatAccessionNumber(123)).toBe('№123')
  })
})

describe('buildMonthlyActivity', () => {
  it('returns one point per month with post counts, most recent months included', () => {
    const now = new Date()
    const currentMonthDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/01`

    const posts = [
      makePost({ id: 1, date: currentMonthDate }),
      makePost({ id: 2, date: currentMonthDate }),
    ]

    const points = buildMonthlyActivity(posts, 3)

    expect(points).toHaveLength(3)
    expect(points[points.length - 1]).toMatchObject({
      year: now.getFullYear(),
      month: now.getMonth(),
      count: 2,
    })
  })
})


describe('language filtering and tag derivation', () => {
  const posts = [
    makePost({ id: 1, lang: 'pt', tags: ['floss', 'git'] }),
    makePost({ id: 2, lang: 'en', tags: ['floss'] }),
    makePost({ id: 3, tags: ['git'] }),
  ];

  it('keeps posts in the chosen language and posts with no language', () => {
    expect(filterPostsByLanguage(posts, 'pt').map((post) => post.id)).toEqual([1, 3]);
    expect(filterPostsByLanguage(posts, 'en').map((post) => post.id)).toEqual([2, 3]);
  });

  it('derives tag counts from the posts it is given', () => {
    expect(buildTagSummary(filterPostsByLanguage(posts, 'en'))).toEqual([
      { slug: 'floss', label: 'floss', totalPosts: 1 },
      { slug: 'git', label: 'git', totalPosts: 1 },
    ]);
    expect(buildTagList(posts).map((tag) => tag.name)).toEqual(['floss', 'git']);
  });
});
