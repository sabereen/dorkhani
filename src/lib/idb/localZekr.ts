import type { TZekr } from '@prisma/client'
import type { LocalZekr } from './idb'

export async function idb_localZekr_get(id: number) {
	const { db } = await import('./idb')
	const localZekr = await db.localZekr.get(id)
	return localZekr
}

export async function idb_localZekr_add(item: Omit<LocalZekr, 'id'>) {
	const { db } = await import('./idb')

	await db.localZekr.add({
		id: item.zekr.id,
		isMine: item.isMine,
		myCount: item.myCount,
		zekr: {
			id: item.zekr.id,
			created: item.zekr.created,
			count: item.zekr.count,
			description: item.zekr.description,
			targetCount: item.zekr.targetCount,
			title: item.zekr.title,
			zekrText: item.zekr.zekrText,
		},
	})
}

export async function idb_localZekr_getList(limit?: number) {
	const { db } = await import('./idb')
	const collection = db.localZekr
		.orderBy('zekr.created')
		.reverse()
		.filter((l) => l.isMine)

	if (limit) {
		return collection.limit(limit).toArray()
	}

	return collection.toArray()
}

export async function idb_localZekr_increaseMyCount(zekr: TZekr, count: number) {
	const { db } = await import('./idb')

	const localZekr = await idb_localZekr_get(zekr.id)
	if (!localZekr) {
		await idb_localZekr_add({
			isMine: false,
			myCount: count,
			zekr,
		})
		return
	}

	const totalCount = (localZekr?.myCount || 0) + count
	await db.localZekr.update(zekr.id, {
		myCount: totalCount,
	})
}
