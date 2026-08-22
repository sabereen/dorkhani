// db.ts
import type { TZekr } from '@prisma-client'
import type { KhatmData } from '$lib/entity/KhatmData'
import Dexie, { type EntityTable } from 'dexie'

/** بازه‌ی انتخاب شده برای ختم */
export interface PickedKhatmPart {
	id: number
	/** تاریخ پیک شدن بازه برای ختم */
	date: Date
	/** شروع بازه انتخاب شده */
	start: number
	/** پایان بازه انتخاب شده */
	end: number
	/** خود آبجکت ختم مورد نظر */
	khatm: KhatmData
	hash?: string | null
}

export interface CreatedKhatm {
	id?: number
	/** ختم ساخته شده */
	khatm: KhatmData
	/** راز یک‌بارمصرف برای انتقال امن ختم مهمان به حساب کاربری */
	claimToken?: string
}

export interface LocalZekr {
	id?: number
	/** ذکر ساخته شده */
	zekr: TZekr
	/** آیا کاربر جاری صاحب این ختم ذکر است */
	isMine: boolean
	/** تعداد ذکرهایی که کاربر جاری از این ختم ذکر تقبل کرده است */
	myCount: number
}

const db = new Dexie('Khatm') as Dexie & {
	pickedKhatmParts: EntityTable<PickedKhatmPart, 'id'>
	createdKhatms: EntityTable<CreatedKhatm, 'id'>
	localZekr: EntityTable<LocalZekr, 'id'>
}

// Schema declaration:
db.version(5).stores({
	pickedKhatmParts: '++id, date',
	createdKhatms: 'id, khatm.created',
	localZekr: 'id, isMine, zekr.created',
})

db.version(6).stores({
	pickedKhatmParts: '++id, date, khatm.id, khatm.seriesId',
	createdKhatms: 'id, khatm.created',
	localZekr: 'id, isMine, zekr.created',
})

export { db }
