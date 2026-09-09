// db.ts
import type { OfflineKhatmPartRecord, OfflineKhatmRecord } from '$lib/contracts/domain'
import type {
	CreatedKhatmRecord,
	LocalZekrRecord,
	PickedKhatmPartRecord,
} from '$lib/storage/types'
import Dexie, { type EntityTable } from 'dexie'

const db = new Dexie('Khatm') as Dexie & {
	pickedKhatmParts: EntityTable<PickedKhatmPartRecord, 'id'>
	createdKhatms: EntityTable<CreatedKhatmRecord, 'id'>
	localZekr: EntityTable<LocalZekrRecord, 'id'>
	offlineKhatms: EntityTable<OfflineKhatmRecord, 'id'>
	offlineKhatmParts: EntityTable<OfflineKhatmPartRecord, 'id'>
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

db.version(7).stores({
	pickedKhatmParts: '++id, date, khatm.id, khatm.seriesId',
	createdKhatms: 'id, khatm.created',
	localZekr: 'id, isMine, zekr.created',
	offlineKhatms: '&id, updated, status',
	offlineKhatmParts: '&id, khatmId, [khatmId+roundNumber], created',
})

export { db }
