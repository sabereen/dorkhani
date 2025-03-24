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
}

const db = new Dexie('Khatm') as Dexie & {
	pickedKhatmParts: EntityTable<
		PickedKhatmPart,
		'id' // primary key "id" (for the typings only)
	>
}

// Schema declaration:
db.version(1).stores({
	pickedKhatmParts: '++id, date', // primary key "id" (for the runtime!)
})

export type { PickedKhatmPart }
export { db }
