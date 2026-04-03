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
