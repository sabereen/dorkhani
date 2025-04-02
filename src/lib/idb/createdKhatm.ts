import type { CreatedKhatm } from './idb'

export async function idb_createdKhatm_add(item: Omit<CreatedKhatm, 'id'>) {
	const { db } = await import('./idb')

	await db.createdKhatms.add({
		id: item.khatm.id,
		hash: item.hash,
		khatm: {
			id: item.khatm.id,
			created: item.khatm.created,
			currentAyahIndex: item.khatm.currentAyahIndex,
			description: item.khatm.description,
			private: item.khatm.private,
			rangeType: item.khatm.rangeType,
			title: item.khatm.title,
			accessToken: item.khatm.accessToken,
		},
	})
}

export async function idb_createdKhatm_getList(limit?: number) {
	const { db } = await import('./idb')
	if (limit) {
		return db.createdKhatms.reverse().limit(limit).toArray()
	}
	return db.createdKhatms.toArray()
}
