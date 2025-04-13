// db.ts
import type { TKhatm } from '@prisma/client'
import Dexie, { type EntityTable } from 'dexie'

/** بازه‌ی انتخاب شده برای ختم */
interface PickedKhatmPart {
	id: number
	/** تاریخ پیک شدن بازه برای ختم */
	date: Date
	/** شروع بازه انتخاب شده */
	start: number
	/** پایان بازه انتخاب شده */
	end: number
	/** خود آبجکت ختم مورد نظر */
	khatm: TKhatm
	hash?: string | null
}

interface CreatedKhatm {
	id?: number
	/** ختم ساخته شده */
	khatm: TKhatm
}

const db = new Dexie('Khatm') as Dexie & {
	pickedKhatmParts: EntityTable<PickedKhatmPart, 'id'>
	createdKhatms: EntityTable<CreatedKhatm, 'id'>
}

// Schema declaration:
db.version(3).stores({
	pickedKhatmParts: '++id, date',
	createdKhatms: 'id, khatm.created',
})

export type { PickedKhatmPart, CreatedKhatm }
export { db }
