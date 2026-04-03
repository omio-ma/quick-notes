import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLiveQuery } from 'dexie-react-hooks'
import NoteList from './NoteList'
import type { Note } from '../db'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

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
