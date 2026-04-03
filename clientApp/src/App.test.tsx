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
