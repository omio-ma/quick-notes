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
