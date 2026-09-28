import type { ClientDatabaseStorage } from './contracts'

export function createBrowserStorage(): ClientDatabaseStorage {
	return {
		ready: async () => {},
		createdKhatms: {
			add: async (item) => (await import('$lib/idb/createdKhatm')).idb_createdKhatm_add(item),
			getList: async (limit) =>
				(await import('$lib/idb/createdKhatm')).idb_createdKhatm_getList(limit),
			getClaims: async () =>
				(await import('$lib/idb/createdKhatm')).idb_createdKhatm_getClaims(),
			hasClaim: async (khatmId, seriesId) =>
				(await import('$lib/idb/createdKhatm')).idb_createdKhatm_hasClaim(khatmId, seriesId),
			clearClaimTokens: async (ids) =>
				(await import('$lib/idb/createdKhatm')).idb_createdKhatm_clearClaimTokens(ids),
		},
		pickedKhatmParts: {
			add: async (item) =>
				(await import('$lib/idb/pickedKhatmPart')).idb_pickedKhatmPart_add(item),
			getList: async (limit) =>
				(await import('$lib/idb/pickedKhatmPart')).idb_pickedKhatmPart_getList(limit),
			getByKhatmId: async (id) =>
				(await import('$lib/idb/pickedKhatmPart')).idb_pickedKhatmPart_getByKhatmId(id),
			getBySeriesId: async (id) =>
				(await import('$lib/idb/pickedKhatmPart')).idb_pickedKhatmPart_getBySeriesId(id),
		},
		localZekrs: {
			get: async (id) => (await import('$lib/idb/localZekr')).idb_localZekr_get(id),
			add: async (item) => (await import('$lib/idb/localZekr')).idb_localZekr_add(item),
			getList: async (limit) =>
				(await import('$lib/idb/localZekr')).idb_localZekr_getList(limit),
			increaseMyCount: async (zekr, count) =>
				(await import('$lib/idb/localZekr')).idb_localZekr_increaseMyCount(zekr, count),
		},
		offlineKhatms: {
			create: async (input) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_create(input),
			get: async (id) => (await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_get(id),
			getList: async () =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_getList(),
			getParts: async (id, round) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_getParts(id, round),
			update: async (id, input) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_update(id, input),
			pickRange: async (id, range) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_pickRange(id, range),
			pickNextAyat: async (id, count) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_pickNextAyat(id, count),
			startNextRound: async (id) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_startNextRound(id),
			stopSeries: async (id) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_stopSeries(id),
			delete: async (id) =>
				(await import('$lib/idb/offlineKhatm')).idb_offlineKhatm_delete(id),
		},
	}
}
