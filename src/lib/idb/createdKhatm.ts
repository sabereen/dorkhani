import type { CreatedKhatm } from './idb'

export async function idb_createdKhatm_add(item: Omit<CreatedKhatm, 'id'>) {
	const { db } = await import('./idb')

	await db.createdKhatms.add({
		id: item.khatm.id,
		claimToken: item.claimToken,
		khatm: {
			id: item.khatm.id,
			created: item.khatm.created,
			versesRead: item.khatm.versesRead,
			pageProgress: item.khatm.pageProgress,
			description: item.khatm.description,
			private: item.khatm.private,
			rangeType: item.khatm.rangeType,
			title: item.khatm.title,
			accessToken: item.khatm.accessToken,
			endDate: item.khatm.endDate,
			roundNumber: item.khatm.roundNumber,
			seriesId: item.khatm.seriesId,
			status: item.khatm.status,
			reviewStatus: item.khatm.reviewStatus,
		},
	})
}

export async function idb_createdKhatm_getList(limit?: number) {
	const { db } = await import('./idb')
	const collection = db.createdKhatms.orderBy('khatm.created').reverse()
	if (limit) {
		return collection.limit(limit).toArray()
	}
	return collection.toArray()
}

export async function idb_createdKhatm_getClaims() {
	const { db } = await import('./idb')
	const list = await db.createdKhatms.toArray()
	return list
		.filter((item): item is CreatedKhatm & { id: number; claimToken: string } =>
			Boolean(item.id && item.claimToken),
		)
		.map((item) => ({ id: item.id, token: item.claimToken }))
}

export async function idb_createdKhatm_hasClaim(khatmId: number, seriesId?: number | null) {
	const { db } = await import('./idb')
	const item = await db.createdKhatms.get(khatmId)
	if (item?.claimToken) return true
	if (seriesId == null) return false

	const seriesItem = await db.createdKhatms
		.filter(
			(createdKhatm) =>
				createdKhatm.khatm.seriesId === seriesId && Boolean(createdKhatm.claimToken),
		)
		.first()
	return Boolean(seriesItem)
}

export async function idb_createdKhatm_clearClaimTokens(ids: ReadonlyArray<number>) {
	const { db } = await import('./idb')
	await db.transaction('rw', db.createdKhatms, async () => {
		for (const id of ids) await db.createdKhatms.update(id, { claimToken: undefined })
	})
}
