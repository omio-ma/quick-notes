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
