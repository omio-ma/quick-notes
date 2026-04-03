# QuickNotes PWA — Design Spec

**Date:** 2026-04-03
**Stack:** React 19, TypeScript, Vite 8 (Rolldown), Dexie.js, vite-plugin-pwa
**Hosting:** GitHub Pages

---

## Purpose

A minimal offline-first note-taking PWA, built as a working blueprint for future projects. Primary goals:

- Understand how to host a PWA on GitHub Pages
- Access the app on mobile and install it to the home screen
- Persist data on-device via IndexedDB (survives browser restarts, no server needed)
- Use mobile data only to check for app updates, not to load notes

---

## 1. Data Layer

**File:** `src/db.ts`

Dexie.js wraps IndexedDB. Chosen over raw IndexedDB (too verbose), localStorage (5MB cap, sync), and PouchDB (overkill — built for CouchDB sync).

```ts
interface Note {
  id?: number
  title: string
  content: string
  updatedAt: number
}

const db = new Dexie('QuickNotesDB')
db.version(1).stores({ notes: '++id, title, updatedAt' })
```

- `db` is exported and imported directly by components — no context or store
- `useLiveQuery` from Dexie drives UI reactivity; no manual state syncing needed

---

## 2. View Routing

**File:** `src/App.tsx`

State-based toggle — no router library.

```ts
type View = 'list' | 'edit'
const [activeView, setActiveView] = useState<View>('list')
const [selectedId, setSelectedId] = useState<number | null>(null)
```

- `'list'` renders `<NoteList />`
- `'edit'` renders `<NoteEditor noteId={selectedId} />`
- Tapping a note card sets `selectedId` and switches to `'edit'`
- The FAB (create new) sets `selectedId = null` and switches to `'edit'`

---

## 3. UI Components

### NoteList (`src/components/NoteList.tsx`)

- Fixed header: app name "QuickNotes"
- Scrollable list of note cards: title, truncated content preview, formatted `updatedAt` date
- FAB fixed bottom-right: tapping opens a blank editor
- Tapping a card opens that note in the editor
- Empty state message when no notes exist

### NoteEditor (`src/components/NoteEditor.tsx`)

- Fixed header: back button (←) on the left, Save button on the right
- Back discards unsaved changes and returns to the list
- Full-width title input
- Full-height textarea for content (fills remaining viewport)
- Save writes to IndexedDB via `db.notes.put()` and returns to the list

---

## 4. Styling

**Strategy:** Plain CSS, one file per component. Zero extra dependencies.

**Files:**
- `src/index.css` — global resets, CSS custom properties (design tokens)
- `src/App.css` — minimal app shell layout
- `src/components/NoteList.css`
- `src/components/NoteEditor.css`

**Theme (dark, mobile-friendly):**
```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --accent: #22c55e;
  --accent-dark: #16a34a;
}
```

Mobile considerations: `user-select: none` on buttons, `touch-action` where needed, viewport meta tag set in `index.html`.

---

## 5. PWA Configuration

**File:** `vite.config.ts`

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'QuickNotes',
    short_name: 'QuickNotes',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#16a34a',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
})
```

- `registerType: 'autoUpdate'` — service worker updates silently in the background
- All app assets are precached; app runs fully offline after first visit
- Two PNG icons required in `/public`: `pwa-192.png`, `pwa-512.png`

---

## 6. GitHub Pages Deployment

**Install note:** `vite-plugin-pwa` is not yet in `package.json`. Install with:
```bash
npm install -D vite-plugin-pwa --legacy-peer-deps
```
The `--legacy-peer-deps` flag is required to bypass a temporary peer dependency conflict between Vite 8 and the PWA plugin.

**Base path:** `base: '/quick-notes/'` in `vite.config.ts` (must match repo name).

**GitHub Actions workflow:** `.github/workflows/deploy.yml`
- Trigger: push to `main`
- Steps: checkout → setup Node → install deps → build → deploy `dist/` to `gh-pages` branch
- Uses `peaceiris/actions-gh-pages` or the official `actions/deploy-pages` action

**Install on phone:**
1. Visit the GitHub Pages URL in Chrome/Safari
2. Tap "Add to Home Screen"
3. App installs in standalone mode — no browser chrome, feels native

---

## File Structure

```
clientApp/
├── public/
│   ├── pwa-192.png
│   └── pwa-512.png
├── src/
│   ├── db.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   └── components/
│       ├── NoteList.tsx
│       ├── NoteList.css
│       ├── NoteEditor.tsx
│       └── NoteEditor.css
├── vite.config.ts
└── package.json

.github/
└── workflows/
    └── deploy.yml
```

---

## Out of Scope (Future)

- Search / filter notes
- Tags or categories
- Markdown rendering
- Cloud sync or backup
- Dark/light mode toggle
