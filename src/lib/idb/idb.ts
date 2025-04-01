// db.ts
import type { Khatm } from '@prisma/client'
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
	khatm: Khatm
	hash?: string | null
}

interface CreatedKhatm {
	id?: number
	/** ختم ساخته شده */
	khatm: Khatm
	/** هش ختم (در صورت خصوصی بودن) */
	hash: string | null
}

const db = new Dexie('Khatm') as Dexie & {
	pickedKhatmParts: EntityTable<PickedKhatmPart, 'id'>
	createdKhatms: EntityTable<CreatedKhatm, 'id'>
}

// Schema declaration:
db.version(2).stores({
	pickedKhatmParts: '++id, date',
	createdKhatms: 'id',
})

export type { PickedKhatmPart, CreatedKhatm }
export { db }
