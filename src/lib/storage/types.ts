import type { KhatmData, ZekrRecord } from '$lib/contracts/domain'

export interface PickedKhatmPartRecord {
	id?: number
	date: Date
	start: number
	end: number
	khatm: KhatmData
	hash?: string | null
}

export interface CreatedKhatmRecord {
	id?: number
	khatm: KhatmData
	claimToken?: string
}

export interface LocalZekrRecord {
	id?: number
	zekr: ZekrRecord
	isMine: boolean
	myCount: number
}
