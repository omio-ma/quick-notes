# QuickNotes PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal offline-first note-taking PWA deployed to GitHub Pages, installable on mobile via "Add to Home Screen."

**Architecture:** State-based view toggle in `App.tsx` (`list` | `edit`) — no router library. Dexie.js wraps IndexedDB for on-device persistence; `useLiveQuery` drives React reactivity automatically. `vite-plugin-pwa` generates the Service Worker and web manifest; a single GitHub Actions workflow deploys `dist/` to the `gh-pages` branch.

**Tech Stack:** React 19, TypeScript, Vite 8, Dexie.js 4, vite-plugin-pwa, Vitest, React Testing Library

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `clientApp/vite.config.ts` | Modify | Add Vitest config (Task 1), add VitePWA plugin + base path (Task 7) |
| `clientApp/tsconfig.app.json` | Modify | Add `vitest/globals` to types |
| `clientApp/package.json` | Modify | Add `test` script |
| `clientApp/src/test-setup.ts` | Create | Global test setup (jest-dom + fake-indexeddb) |
| `clientApp/src/db.ts` | Create | Dexie database + Note type |
| `clientApp/src/index.css` | Replace | Dark theme CSS variables + global resets |
| `clientApp/src/App.css` | Replace | App shell layout |
| `clientApp/src/App.tsx` | Replace | State-based view router |
| `clientApp/src/components/NoteList.tsx` | Create | Note list view |
| `clientApp/src/components/NoteList.css` | Create | Note list styles |
| `clientApp/src/components/NoteEditor.tsx` | Create | Note editor view |
| `clientApp/src/components/NoteEditor.css` | Create | Note editor styles |
| `clientApp/public/pwa-icon.svg` | Create | Source icon for PWA asset generation |
| `clientApp/public/pwa-192x192.png` | Generate | PWA manifest icon |
| `clientApp/public/pwa-512x512.png` | Generate | PWA manifest icon |
| `.github/workflows/deploy.yml` | Create | Build + deploy to GitHub Pages |

---

## Task 1: Install Dependencies + Testing Setup

**Files:**
- Modify: `clientApp/vite.config.ts`
- Modify: `clientApp/tsconfig.app.json`
- Modify: `clientApp/package.json`
- Create: `clientApp/src/test-setup.ts`

- [ ] **Step 1: Install all dependencies**

```bash
cd clientApp
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom fake-indexeddb
npm install -D vite-plugin-pwa --legacy-peer-deps
```

> Note: `--legacy-peer-deps` is required for `vite-plugin-pwa` due to a temporary peer dependency conflict with Vite 8.

- [ ] **Step 2: Update `vite.config.ts` with test configuration**

Replace the full file:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

> The `VitePWA` plugin and `base` path are added in Task 7, after icons are generated.

- [ ] **Step 3: Update `tsconfig.app.json` to include Vitest globals**

Change the `"types"` array:

```json
"types": ["vite/client", "vitest/globals"]
```

- [ ] **Step 4: Add test script to `package.json`**

Add to `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
```

> `fake-indexeddb/auto` polyfills `indexedDB` globally so all tests (including Dexie) work in jsdom without a real browser.

- [ ] **Step 6: Write a smoke test to verify the setup works**

Create `src/smoke.test.ts`:

```ts
describe('test setup', () => {
  it('runs', () => {
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 7: Run the smoke test**

```bash
npm run test:run
```

Expected output: `1 passed`

- [ ] **Step 8: Delete the smoke test**

```bash
rm src/smoke.test.ts
```

- [ ] **Step 9: Commit**

```bash
git add clientApp/
git commit -m "feat: install vitest, react testing library, vite-plugin-pwa"
```

---

## Task 2: Database Layer

**Files:**
- Create: `clientApp/src/db.ts`
- Create: `clientApp/src/db.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/db.test.ts`:

```ts
import { db } from './db'

beforeEach(async () => {
  await db.notes.clear()
})

describe('db', () => {
  it('adds a note and retrieves it by id', async () => {
    const id = await db.notes.add({
      title: 'Hello',
      content: 'World',
      updatedAt: 1700000000000,
    })
    const note = await db.notes.get(id)
    expect(note?.title).toBe('Hello')
    expect(note?.content).toBe('World')
    expect(note?.updatedAt).toBe(1700000000000)
  })

  it('updates a note', async () => {
    const id = await db.notes.add({
      title: 'Original',
      content: 'Content',
      updatedAt: 1700000000000,
    })
    await db.notes.update(id, { title: 'Updated' })
    const note = await db.notes.get(id)
    expect(note?.title).toBe('Updated')
  })

  it('deletes a note', async () => {
    const id = await db.notes.add({
      title: 'Temp',
      content: '',
      updatedAt: Date.now(),
    })
    await db.notes.delete(id)
    const note = await db.notes.get(id)
    expect(note).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run
```

Expected: FAIL — `Cannot find module './db'`

- [ ] **Step 3: Implement `src/db.ts`**

```ts
import Dexie, { type EntityTable } from 'dexie'

export interface Note {
  id: number
  title: string
  content: string
  updatedAt: number
}

const db = new Dexie('QuickNotesDB') as Dexie & {
  notes: EntityTable<Note, 'id'>
}

db.version(1).stores({
  notes: '++id, title, updatedAt',
})

export { db }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run
```

Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add clientApp/src/db.ts clientApp/src/db.test.ts
git commit -m "feat: add Dexie database layer"
```

---

## Task 3: Global Styles

**Files:**
- Replace: `clientApp/src/index.css`
- Replace: `clientApp/src/App.css`

No tests for CSS — verified visually during Task 4 dev server smoke check.

- [ ] **Step 1: Replace `src/index.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
}

:root {
  --bg: #0d1117;
  --surface: #161b22;
  --surface-hover: #1f2937;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --accent: #22c55e;
  --accent-dark: #16a34a;
  --border: #30363d;
  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

#root {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

button {
  cursor: pointer;
  font-family: var(--sans);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
```

- [ ] **Step 2: Replace `src/App.css`**

```css
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}
```

- [ ] **Step 3: Commit**

```bash
git add clientApp/src/index.css clientApp/src/App.css
git commit -m "feat: add dark theme CSS variables and app shell styles"
```

---

## Task 4: App Shell Routing

**Files:**
- Replace: `clientApp/src/App.tsx`
- Create: `clientApp/src/App.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('./components/NoteList', () => ({
  default: ({ onEdit }: { onEdit: (id: number | null) => void }) => (
    <div>
      <span>NoteList</span>
      <button onClick={() => onEdit(null)}>New Note</button>
      <button onClick={() => onEdit(1)}>Edit Note 1</button>
    </div>
  ),
}))

vi.mock('./components/NoteEditor', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div>
      <span>NoteEditor</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}))

describe('App', () => {
  it('renders NoteList by default', () => {
    render(<App />)
    expect(screen.getByText('NoteList')).toBeInTheDocument()
    expect(screen.queryByText('NoteEditor')).not.toBeInTheDocument()
  })

  it('switches to NoteEditor when onEdit is called with null (new note)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('New Note'))
    expect(screen.getByText('NoteEditor')).toBeInTheDocument()
    expect(screen.queryByText('NoteList')).not.toBeInTheDocument()
  })

  it('switches to NoteEditor when onEdit is called with an id', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('Edit Note 1'))
    expect(screen.getByText('NoteEditor')).toBeInTheDocument()
  })

  it('returns to NoteList when onBack is called', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('New Note'))
    await user.click(screen.getByText('Back'))
    expect(screen.getByText('NoteList')).toBeInTheDocument()
    expect(screen.queryByText('NoteEditor')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run
```

Expected: FAIL — components don't exist yet

- [ ] **Step 3: Implement `src/App.tsx`**

```tsx
import { useState } from 'react'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import './App.css'

type View = 'list' | 'edit'

function App() {
  const [view, setView] = useState<View>('list')
  const [noteId, setNoteId] = useState<number | null>(null)

  function handleEdit(id: number | null) {
    setNoteId(id)
    setView('edit')
  }

  function handleBack() {
    setView('list')
  }

  return (
    <div className="app">
      {view === 'list' && <NoteList onEdit={handleEdit} />}
      {view === 'edit' && <NoteEditor noteId={noteId} onBack={handleBack} />}
    </div>
  )
}

export default App
```

- [ ] **Step 4: Create stub components so App.tsx compiles**

Create `src/components/NoteList.tsx`:

```tsx
export default function NoteList(_: { onEdit: (id: number | null) => void }) {
  return <div>NoteList stub</div>
}
```

Create `src/components/NoteEditor.tsx`:

```tsx
export default function NoteEditor(_: { noteId: number | null; onBack: () => void }) {
  return <div>NoteEditor stub</div>
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run
```

Expected: `4 passed` (App tests) + `3 passed` (db tests) = `7 passed`

- [ ] **Step 6: Commit**

```bash
git add clientApp/src/App.tsx clientApp/src/App.test.tsx clientApp/src/App.css clientApp/src/components/
git commit -m "feat: add App shell with state-based view routing"
```

---

## Task 5: NoteList Component

**Files:**
- Replace: `clientApp/src/components/NoteList.tsx` (replace stub)
- Create: `clientApp/src/components/NoteList.css`
- Create: `clientApp/src/components/NoteList.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/NoteList.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLiveQuery } from 'dexie'
import NoteList from './NoteList'
import type { Note } from '../db'

vi.mock('dexie', async (importOriginal) => {
  const actual = await importOriginal<typeof import('dexie')>()
  return { ...actual, useLiveQuery: vi.fn() }
})

vi.mock('../db', () => ({
  db: { notes: { put: vi.fn(), delete: vi.fn() } },
}))

const mockUseLiveQuery = vi.mocked(useLiveQuery)

const mockNotes: Note[] = [
  { id: 1, title: 'First Note', content: 'Some content here for preview', updatedAt: 1700000000000 },
  { id: 2, title: 'Second Note', content: 'More content', updatedAt: 1700000001000 },
]

describe('NoteList', () => {
  const onEdit = vi.fn()

  beforeEach(() => {
    onEdit.mockClear()
  })

  it('shows empty state message when there are no notes', () => {
    mockUseLiveQuery.mockReturnValue([])
    render(<NoteList onEdit={onEdit} />)
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('renders a card for each note', () => {
    mockUseLiveQuery.mockReturnValue(mockNotes)
    render(<NoteList onEdit={onEdit} />)
    expect(screen.getByText('First Note')).toBeInTheDocument()
    expect(screen.getByText('Second Note')).toBeInTheDocument()
  })

  it('calls onEdit with the note id when a card is clicked', async () => {
    const user = userEvent.setup()
    mockUseLiveQuery.mockReturnValue(mockNotes)
    render(<NoteList onEdit={onEdit} />)
    await user.click(screen.getByText('First Note'))
    expect(onEdit).toHaveBeenCalledWith(1)
  })

  it('calls onEdit with null when the FAB is clicked', async () => {
    const user = userEvent.setup()
    mockUseLiveQuery.mockReturnValue([])
    render(<NoteList onEdit={onEdit} />)
    await user.click(screen.getByRole('button', { name: /new note/i }))
    expect(onEdit).toHaveBeenCalledWith(null)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run
```

Expected: FAIL — NoteList stub doesn't render expected elements

- [ ] **Step 3: Implement `src/components/NoteList.tsx`**

```tsx
import { useLiveQuery } from 'dexie'
import { db } from '../db'
import type { Note } from '../db'
import './NoteList.css'

interface Props {
  onEdit: (id: number | null) => void
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function NoteList({ onEdit }: Props) {
  const notes = useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().toArray(),
    []
  ) ?? []

  return (
    <div className="note-list">
      <header className="note-list__header">
        <h1>QuickNotes</h1>
      </header>

      <div className="note-list__body">
        {notes.length === 0 ? (
          <p className="note-list__empty">No notes yet. Tap + to create one.</p>
        ) : (
          (notes as Note[]).map((note) => (
            <button
              key={note.id}
              className="note-card"
              onClick={() => onEdit(note.id)}
            >
              <span className="note-card__title">{note.title || 'Untitled'}</span>
              <span className="note-card__preview">{note.content}</span>
              <span className="note-card__date">{formatDate(note.updatedAt)}</span>
            </button>
          ))
        )}
      </div>

      <button
        className="fab"
        aria-label="New note"
        onClick={() => onEdit(null)}
      >
        +
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/NoteList.css`**

```css
.note-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.note-list__header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  flex-shrink: 0;
}

.note-list__header h1 {
  margin: 0;
  padding: 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.note-list__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.note-list__empty {
  color: var(--text-muted);
  text-align: center;
  margin-top: 64px;
  font-size: 15px;
}

.note-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  text-align: left;
  gap: 4px;
  color: var(--text);
}

.note-card:hover,
.note-card:focus {
  background: var(--surface-hover);
  outline: none;
}

.note-card__title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-card__preview {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-card__date {
  font-size: 12px;
  color: var(--text-muted);
}

.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent);
  color: #0d1117;
  font-size: 28px;
  font-weight: bold;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.fab:active {
  background: var(--accent-dark);
}
```

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```

Expected: all previous tests still pass + 4 new NoteList tests pass

- [ ] **Step 6: Commit**

```bash
git add clientApp/src/components/NoteList.tsx clientApp/src/components/NoteList.css clientApp/src/components/NoteList.test.tsx
git commit -m "feat: implement NoteList view with live query and FAB"
```

---

## Task 6: NoteEditor Component

**Files:**
- Replace: `clientApp/src/components/NoteEditor.tsx` (replace stub)
- Create: `clientApp/src/components/NoteEditor.css`
- Create: `clientApp/src/components/NoteEditor.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/NoteEditor.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '../db'
import NoteEditor from './NoteEditor'

vi.mock('../db', () => ({
  db: {
    notes: {
      get: vi.fn(),
      put: vi.fn(),
    },
  },
}))

describe('NoteEditor', () => {
  const onBack = vi.fn()

  beforeEach(() => {
    onBack.mockClear()
    vi.mocked(db.notes.get).mockResolvedValue(undefined)
    vi.mocked(db.notes.put).mockResolvedValue(1)
  })

  it('renders title input, content textarea, back and save buttons', () => {
    render(<NoteEditor noteId={null} onBack={onBack} />)
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Start writing...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked without saving', async () => {
    const user = userEvent.setup()
    render(<NoteEditor noteId={null} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalled()
    expect(db.notes.put).not.toHaveBeenCalled()
  })

  it('saves new note to db and calls onBack when save is clicked', async () => {
    const user = userEvent.setup()
    render(<NoteEditor noteId={null} onBack={onBack} />)
    await user.type(screen.getByPlaceholderText('Title'), 'My Note')
    await user.type(screen.getByPlaceholderText('Start writing...'), 'Hello world')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(db.notes.put).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Note', content: 'Hello world' })
    )
    expect(onBack).toHaveBeenCalled()
  })

  it('loads existing note data when noteId is provided', async () => {
    vi.mocked(db.notes.get).mockResolvedValue({
      id: 5,
      title: 'Existing Title',
      content: 'Existing content',
      updatedAt: 1700000000000,
    })
    render(<NoteEditor noteId={5} onBack={onBack} />)
    expect(await screen.findByDisplayValue('Existing Title')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Existing content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run
```

Expected: FAIL — NoteEditor stub doesn't render expected elements

- [ ] **Step 3: Implement `src/components/NoteEditor.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { db } from '../db'
import './NoteEditor.css'

interface Props {
  noteId: number | null
  onBack: () => void
}

export default function NoteEditor({ noteId, onBack }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (noteId === null) return
    db.notes.get(noteId).then((note) => {
      if (note) {
        setTitle(note.title)
        setContent(note.content)
      }
    })
  }, [noteId])

  async function handleSave() {
    await db.notes.put({
      ...(noteId !== null ? { id: noteId } : {}),
      title,
      content,
      updatedAt: Date.now(),
    })
    onBack()
  }

  return (
    <div className="note-editor">
      <header className="note-editor__header">
        <button className="note-editor__back" onClick={onBack} aria-label="Back">
          ←
        </button>
        <button className="note-editor__save" onClick={handleSave} aria-label="Save">
          Save
        </button>
      </header>

      <div className="note-editor__body">
        <input
          className="note-editor__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          type="text"
        />
        <textarea
          className="note-editor__content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/NoteEditor.css`**

```css
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.note-editor__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  flex-shrink: 0;
}

.note-editor__back {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 20px;
  padding: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-editor__save {
  background: var(--accent);
  border: none;
  color: #0d1117;
  font-size: 15px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 6px;
  min-height: 44px;
}

.note-editor__save:active {
  background: var(--accent-dark);
}

.note-editor__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  gap: 12px;
}

.note-editor__title {
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 20px;
  font-weight: 600;
  padding: 8px 0;
  outline: none;
  font-family: var(--sans);
}

.note-editor__title::placeholder {
  color: var(--text-muted);
}

.note-editor__content {
  flex: 1;
  background: none;
  border: none;
  color: var(--text);
  font-size: 16px;
  line-height: 1.6;
  padding: 8px 0;
  outline: none;
  resize: none;
  font-family: var(--sans);
}

.note-editor__content::placeholder {
  color: var(--text-muted);
}
```

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass (db: 3, App: 4, NoteList: 4, NoteEditor: 4 = 15 total)

- [ ] **Step 6: Quick dev server check**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Verify: dark theme loads, list view shows, FAB opens editor, save returns to list, notes appear in the list.

- [ ] **Step 7: Commit**

```bash
git add clientApp/src/components/NoteEditor.tsx clientApp/src/components/NoteEditor.css clientApp/src/components/NoteEditor.test.tsx
git commit -m "feat: implement NoteEditor view with load and save"
```

---

## Task 7: PWA Icons + Vite Config

**Files:**
- Create: `clientApp/public/pwa-icon.svg`
- Generate: `clientApp/public/pwa-192x192.png`
- Generate: `clientApp/public/pwa-512x512.png`
- Modify: `clientApp/vite.config.ts`

- [ ] **Step 1: Create the source icon SVG**

Create `clientApp/public/pwa-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#16a34a"/>
  <text
    x="256"
    y="330"
    font-family="system-ui, sans-serif"
    font-size="220"
    font-weight="700"
    text-anchor="middle"
    fill="white"
  >QN</text>
</svg>
```

- [ ] **Step 2: Install the icon generator and generate PNG icons**

```bash
cd clientApp
npm install -D @vite-pwa/assets-generator --legacy-peer-deps
npx pwa-assets-generator --preset minimal-2023 public/pwa-icon.svg
```

This generates in `public/`: `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`.

> If the command fails, manually place any 192×192 PNG as `public/pwa-192x192.png` and any 512×512 PNG as `public/pwa-512x512.png`, then continue.

- [ ] **Step 3: Uninstall the generator (it's a one-time tool)**

```bash
npm uninstall @vite-pwa/assets-generator
```

- [ ] **Step 4: Update `vite.config.ts` with the PWA plugin and base path**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/quick-notes/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'QuickNotes',
        short_name: 'QuickNotes',
        display: 'standalone',
        background_color: '#0d1117',
        theme_color: '#16a34a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

> `base: '/quick-notes/'` must match your GitHub repository name exactly. If your repo is named differently, update this value.

- [ ] **Step 5: Run a production build to verify PWA config is valid**

```bash
npm run build
```

Expected: `dist/` folder created, no errors. The output should include a `sw.js` (service worker) and `manifest.webmanifest` file.

- [ ] **Step 6: Run all tests to confirm nothing broke**

```bash
npm run test:run
```

Expected: 15 passed

- [ ] **Step 7: Commit**

```bash
git add clientApp/public/ clientApp/vite.config.ts clientApp/package.json clientApp/package-lock.json
git commit -m "feat: add PWA manifest, service worker, and app icons"
```

---

## Task 8: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Enable GitHub Pages in your repo settings**

Go to your GitHub repo → **Settings** → **Pages** → set Source to **"Deploy from a branch"** → Branch: `gh-pages` / `/ (root)`. Save.

> The `gh-pages` branch is created automatically by the workflow on first run.

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: clientApp/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: clientApp

      - name: Build
        run: npm run build
        working-directory: clientApp

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: clientApp/dist
```

- [ ] **Step 3: Commit and push to trigger the workflow**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deploy workflow for GitHub Pages"
git push origin main
```

- [ ] **Step 4: Verify the workflow runs**

Go to your GitHub repo → **Actions** tab. Watch the `Deploy to GitHub Pages` workflow run. It should complete with a green checkmark in ~2 minutes.

- [ ] **Step 5: Visit the deployed app**

Open `https://<your-github-username>.github.io/quick-notes/` in Chrome on your phone.

- [ ] **Step 6: Install to home screen**

In Chrome on Android: tap the three-dot menu → **"Add to Home screen"**.
In Safari on iPhone: tap the Share button → **"Add to Home Screen"**.

The app opens in standalone mode — no browser chrome, full screen, green status bar. Notes are saved to your phone's IndexedDB and persist across sessions.

---

## Done

The app is live and installable. Key things this blueprint demonstrates:

- **IndexedDB via Dexie** — on-device persistence with no backend
- **PWA + Service Worker** — offline-first, installable to home screen
- **GitHub Pages deploy** — zero-cost static hosting with CI/CD
- **State-based routing** — simple, no router library needed for small apps
