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
