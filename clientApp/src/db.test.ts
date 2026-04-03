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
