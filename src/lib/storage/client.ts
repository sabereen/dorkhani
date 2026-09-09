import { browser } from '$app/environment'
import { isCapacitorBuild } from '$lib/config/runtime'
import { Capacitor } from '@capacitor/core'
import { createBrowserStorage } from './browser'
import type { ClientDatabaseStorage, ClientStorage } from './contracts'
import { createNativeStorage } from './native'
import { settingsStore } from './settings'

let selected: ClientDatabaseStorage | undefined

export class StorageUnavailableError extends Error {
	constructor(public cause: unknown) {
		super('Client storage is unavailable.')
		this.name = 'StorageUnavailableError'
	}
}

function storage() {
	selected ??=
		browser && isCapacitorBuild && Capacitor.getPlatform() === 'android'
			? createNativeStorage()
			: createBrowserStorage()
	return selected
}

export const clientStorage: ClientStorage = {
	ready: async () => {
		try {
			await Promise.all([settingsStore.ready(), storage().ready()])
		} catch (cause) {
			throw new StorageUnavailableError(cause)
		}
	},
	settings: settingsStore,
	createdKhatms: {
		add: (item) => storage().createdKhatms.add(item),
		getList: (limit) => storage().createdKhatms.getList(limit),
		getClaims: () => storage().createdKhatms.getClaims(),
		hasClaim: (khatmId, seriesId) => storage().createdKhatms.hasClaim(khatmId, seriesId),
		clearClaimTokens: (ids) => storage().createdKhatms.clearClaimTokens(ids),
	},
	pickedKhatmParts: {
		add: (item) => storage().pickedKhatmParts.add(item),
		getList: (limit) => storage().pickedKhatmParts.getList(limit),
		getByKhatmId: (id) => storage().pickedKhatmParts.getByKhatmId(id),
		getBySeriesId: (id) => storage().pickedKhatmParts.getBySeriesId(id),
	},
	localZekrs: {
		get: (id) => storage().localZekrs.get(id),
		add: (item) => storage().localZekrs.add(item),
		getList: (limit) => storage().localZekrs.getList(limit),
		increaseMyCount: (zekr, count) => storage().localZekrs.increaseMyCount(zekr, count),
	},
	offlineKhatms: {
		create: (input) => storage().offlineKhatms.create(input),
		get: (id) => storage().offlineKhatms.get(id),
		getList: () => storage().offlineKhatms.getList(),
		getParts: (id, round) => storage().offlineKhatms.getParts(id, round),
		update: (id, input) => storage().offlineKhatms.update(id, input),
		pickRange: (id, range) => storage().offlineKhatms.pickRange(id, range),
		pickNextAyat: (id, count) => storage().offlineKhatms.pickNextAyat(id, count),
		startNextRound: (id) => storage().offlineKhatms.startNextRound(id),
		stopSeries: (id) => storage().offlineKhatms.stopSeries(id),
		delete: (id) => storage().offlineKhatms.delete(id),
	},
}

export { settingsStore }
export * from './offline-domain'
export * from './migrations'
export type * from './contracts'
export type * from './types'
