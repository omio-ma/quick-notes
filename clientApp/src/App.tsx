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
