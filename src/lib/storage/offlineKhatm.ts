import { clientStorage } from './client'

export const offlineKhatm_create = (...args: Parameters<typeof clientStorage.offlineKhatms.create>) =>
	clientStorage.offlineKhatms.create(...args)
export const offlineKhatm_get = (...args: Parameters<typeof clientStorage.offlineKhatms.get>) =>
	clientStorage.offlineKhatms.get(...args)
export const offlineKhatm_getList = () => clientStorage.offlineKhatms.getList()
export const offlineKhatm_getParts = (
	...args: Parameters<typeof clientStorage.offlineKhatms.getParts>
) => clientStorage.offlineKhatms.getParts(...args)
export const offlineKhatm_update = (...args: Parameters<typeof clientStorage.offlineKhatms.update>) =>
	clientStorage.offlineKhatms.update(...args)
export const offlineKhatm_pickRange = (
	...args: Parameters<typeof clientStorage.offlineKhatms.pickRange>
) => clientStorage.offlineKhatms.pickRange(...args)
export const offlineKhatm_pickNextAyat = (
	...args: Parameters<typeof clientStorage.offlineKhatms.pickNextAyat>
) => clientStorage.offlineKhatms.pickNextAyat(...args)
export const offlineKhatm_startNextRound = (
	...args: Parameters<typeof clientStorage.offlineKhatms.startNextRound>
) => clientStorage.offlineKhatms.startNextRound(...args)
export const offlineKhatm_stopSeries = (
	...args: Parameters<typeof clientStorage.offlineKhatms.stopSeries>
) => clientStorage.offlineKhatms.stopSeries(...args)
export const offlineKhatm_delete = (...args: Parameters<typeof clientStorage.offlineKhatms.delete>) =>
	clientStorage.offlineKhatms.delete(...args)

export * from './offline-domain'
