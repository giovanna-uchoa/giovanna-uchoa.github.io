# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> [!WARNING]
> Much of this project was vibecoded / bootstrapped from boilerplate. Treat existing patterns as a starting point, not a best-practices reference.

## Commands

```bash
npm run dev         # start Vite dev server
npm run build        # production build -> build/
npm run lint          # eslint on src/**/*.{ts,tsx}
npm run lint:fix      # eslint --fix
npm run test           # run the Vitest suite once
npm run test:watch     # Vitest in watch mode
```

Type-checking runs implicitly through the Vite/SWC build (no standalone `tsc --noEmit` script exists — run `npx tsc --noEmit` directly if type verification is needed without a full build).

To run the app against a real backend, create `.env` at the project root (see `.env.sample`) with `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`, and `VITE_GITHUB_BRANCH` pointing at the GitHub repo that holds the `content/` folder. There is no database and no migration step — content lives as files in that repo. Admin writes additionally require a GitHub Personal Access Token, entered at `/admin` login (kept in `sessionStorage`, never in `.env`).

## Architecture

**Stack**: React 18 + TypeScript, Vite (SWC), Material UI v5, React Router (`BrowserRouter`, so routes are plain paths like `/post/15`), GitHub Contents API as the backend (no server, no database), `react-markdown` + `remark-gfm`, `js-yaml` for frontmatter.

### Data flow

There is no server layer and no database — content lives as markdown files with YAML frontmatter under `content/` in a GitHub repo, read via `raw.githubusercontent.com` and written via the GitHub REST Contents API. The layering:

- `src/utils/githubClient.ts` — transport only. `getRawFile` (public, unauthenticated GET against `raw.githubusercontent.com`, 404 → `null`); `getFileWithSha`/`putFile`/`deleteFile` (authenticated, hit `api.github.com/repos/.../contents/...`, base64-encode/decode UTF-8 content). Every write requires a stored PAT — `authHeaders()` throws `'Not authenticated'` if none is present. This is the only file that builds GitHub URLs or calls `fetch` against GitHub.
- `src/utils/frontmatter.ts` — `parseFrontmatter`/`stringifyFrontmatter`, pure YAML-frontmatter parse/serialize via `js-yaml`'s `load`/`dump`. No GitHub- or domain-specific knowledge.
- `src/utils/githubAuth.ts` — PAT lifecycle: `getStoredToken`/`setStoredToken`/`clearStoredToken` wrap `sessionStorage` (key `academic-archive:github-pat`); `validateToken` calls `GET https://api.github.com/user` to confirm the PAT works before accepting it.
- `src/utils/cmsApi.ts` — the sole data-access layer (`cmsApi` object). Orchestrates the three files above plus `content/manifest.json`, a generated index of subject/post *summaries* used for all listing pages (one cheap fetch instead of one per post). Individual post `content` bodies are NOT in the manifest — `listPosts`/`listPostsBySubjectId` return posts with `content: ''`; only `getPost` (which reads `content/posts/{id}.md` directly) populates `content`. Business rules that used to be enforced by Postgres/RLS are now plain code here: `deleteSubject` cascades by deleting every post file under that subject before removing the subject and rewriting the manifest; `renameTag`/`removeTag` rewrite every post file that carries the tag (tags aren't a standalone entity — see "Tags" below); `computeNextPostId` hand-rolls `max(existing ids) + 1`. Read methods need no auth; every mutation implicitly requires a valid stored PAT via `githubClient.ts`.
- `src/utils/useCmsContent.ts` — the app-wide data hook. One-shot `Promise.all` of `listSubjects`/`listPosts`/`listTags`/`listTagSummary` on mount, plus a manually-invoked `reload()` (called by admin forms after a mutation). No realtime subscription — GitHub has no equivalent to Supabase Realtime, so nothing auto-refreshes across tabs; a manual `reload()` (or page refresh) is required to see changes made elsewhere.
- `src/utils/dataTypes.ts` — shared domain types (`Subject`, `Post`, `Tag`, `CategorySummary`, `TagSummary`, `ArchiveGroup`).
- `src/utils/contentTaxonomy.ts` — pure derivation/formatting functions over already-loaded data: date parsing/formatting, `buildCategorySummary`, `buildArchiveGroups`, tag slugging (`toTagSlug`). No GitHub calls here — this is the place for new client-side aggregation logic.

### Dates

Posts store and display dates as `yyyy/mm/dd` (frontmatter and UI use the same format — there's no separate DB storage format to convert to/from anymore). `normalizePostDate` (in `contentTaxonomy.ts`) validates and normalizes date strings; route new date handling through it rather than parsing ad hoc.

### Tags

Tags are not a standalone entity — each post's frontmatter carries a plain `tags: string[]`. `cmsApi.listTags`/`listTagSummary` derive the full tag list and per-tag post counts by scanning every post's `tags` array in the manifest. There's no tag "id" to edit — `TagForm.tsx` calls `cmsApi.renameTag`/`removeTag`, which rewrite every affected post's frontmatter (and the manifest's cached copy of each post's `tags`) in one pass. Tag slugs are generated client-side via `toTagSlug` in `contentTaxonomy.ts` (NFD normalization + lowercasing).

### Auth

Admin panel (`/admin`) uses a GitHub Personal Access Token, not a session. `LoginDialog.tsx` calls `githubAuth.validateToken(token)`; on success the token is stored via `setStoredToken` (`sessionStorage` only — cleared when the tab closes) and `AdminPage.tsx` re-validates it on mount to restore/verify the session. There's no app-level role system and no RLS-equivalent — access control is "possession of a PAT with write access to the configured repo," enforced implicitly wherever `githubClient.ts` needs to authenticate a write.

### Routing & pages

Routes are declared in `src/App.tsx` using `BrowserRouter`, with every page lazy-loaded via `React.lazy`. The site is served from the domain root on GitHub Pages (`base: '/'`); the build copies `index.html` to `404.html` (see `spaFallback` in `vite.config.ts`) so deep links load the app, and `main.tsx` rewrites legacy `/#/...` links to path URLs before mounting. Route params (`subjectId`/`postId`/`tagSlug`) are used directly as `cmsApi` lookup keys (see `pages/`). Post URLs exist in two forms — `/subjects/:subjectId/post/:postId` and `/post/:postId` — both resolved by the same `PostPage`.

### Theming

`src/theme/muiTheme.ts` defines the MUI theme plus a separate `getContentPalette(mode)` helper for markdown/content-specific colors and shadows (code blocks, blockquotes, elevated card shadow) that aren't part of the standard MUI palette — `MarkdownContent.tsx`, `BlogCard.tsx`, `CategoryCard.tsx`, and `App.tsx` pull from this rather than hardcoding colors/shadows, so new markdown-adjacent or elevated-surface UI should do the same for light/dark parity. **Every color in the app lives in this one file** — there are no other hardcoded hex values anywhere in `src/`, so a palette change only ever touches `muiTheme.ts`.

Fonts are real, loaded fonts, not just CSS names hoping for a system fallback: `Source Serif 4` (titles and post body, exported as `headingFont`), `IBM Plex Sans` (interface) and `JetBrains Mono` (identifiers, dates, code; exported as `monoFont`) are pulled from Google Fonts via a `<link>` in `index.html`. Any `Typography` that should carry the serif voice needs an explicit `variant` that maps to a heading (`h1`–`h6`) or an explicit `fontFamily: headingFont` — MUI's default variant (`body1`) falls back to the body font, which has silently broken at least one custom-styled heading before (`BlogPost.tsx`'s post title). The `overline` variant and `Chip` labels use the mono font.

Current identity is a "lab notebook" (redesign in progress, see the plan): cool off-white paper (`#f7f7f5`) with near-black ink and **one** cobalt accent in light mode (`#2845d6`); a near-black ground (`#0e1014`) with the same ink-white text and a lighter cobalt accent (`#8fa3ff`) in dark mode. `primary` and `secondary` carry the same accent on purpose (much of the code uses `secondary.main` as "the accent"). When touching the palette, change both `themeOptions` and `darkThemeOptions` together, not just one.

Two UI conventions grew out of this identity, worth following for any new card/grid work rather than inventing a new pattern:
- **Call-number / accession-number labels**: `CategoryCard.tsx` shows the subject's own `id` uppercased (e.g. `MAC0470`) and `BlogCard.tsx` shows the post's zero-padded numeric `id` prefixed with `№` (e.g. `№015`), both as a small `overline`-variant label above the title — real identifiers already used elsewhere (subject id, post id used in the URL), not decorative numbering.
- **Featured-tile grids**: `CatalogPage.tsx` and `HomePage.tsx`'s "Recent Entries" both lay out cards in a CSS grid where the first (already-sorted-to-the-top) item spans extra columns/rows and gets `featured` passed down to `CategoryCard`/`BlogCard`, which then scales up its own title variant, line-clamp, padding, and corner icon-button size. There's no rotation/tilt anywhere in the app — an earlier alternating-tilt treatment on these same two grids was tried and explicitly reverted.

### Markdown rendering

`MarkdownContent.tsx` is the only markdown renderer, used for post content, subject descriptions (`CategoryHeader.tsx`), and subject overviews (`SubjectPage.tsx`). It renders through `react-markdown` (raw HTML is not enabled), with custom MUI-styled components per markdown element (headings, paragraphs, code, links, lists) — extend this component's `components` map rather than introducing a second renderer.

### Path alias

`@/` resolves to `src/` (configured in `vite.config.ts`), available for use in new code alongside relative imports.
