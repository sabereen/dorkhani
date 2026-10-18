import type { OfflineKhatmPartRecord, OfflineKhatmRecord, ZekrRecord } from '$lib/contracts/domain'
import type { QuranRange } from '$lib/entity/Range'
import type { CreateOfflineKhatmInput } from './offline-domain'
import type { CreatedKhatmRecord, LocalZekrRecord, PickedKhatmPartRecord } from './types'

export interface CreatedKhatmRepository {
	add(item: Omit<CreatedKhatmRecord, 'id'>): Promise<void>
	getList(limit?: number): Promise<CreatedKhatmRecord[]>
	getClaims(): Promise<Array<{ id: number; token: string }>>
	hasClaim(khatmId: number, seriesId?: number | null): Promise<boolean>
	clearClaimTokens(ids: ReadonlyArray<number>): Promise<void>
}

export interface PickedKhatmPartRepository {
	add(item: Omit<PickedKhatmPartRecord, 'id'>): Promise<void>
	getList(limit?: number): Promise<PickedKhatmPartRecord[]>
	getByKhatmId(khatmId: number): Promise<PickedKhatmPartRecord[]>
	getBySeriesId(seriesId: number): Promise<PickedKhatmPartRecord[]>
}

export interface LocalZekrRepository {
	get(id: number): Promise<LocalZekrRecord | undefined>
	add(item: Omit<LocalZekrRecord, 'id'>): Promise<void>
	getList(limit?: number): Promise<LocalZekrRecord[]>
	increaseMyCount(zekr: ZekrRecord, count: number): Promise<void>
}

export interface OfflineKhatmRepository {
	create(input: CreateOfflineKhatmInput): Promise<OfflineKhatmRecord>
	get(id: string): Promise<OfflineKhatmRecord>
	getList(): Promise<OfflineKhatmRecord[]>
	getParts(id: string, roundNumber?: number): Promise<OfflineKhatmPartRecord[]>
	update(
		id: string,
		input: Pick<CreateOfflineKhatmInput, 'title' | 'description' | 'rangeType'>,
	): Promise<OfflineKhatmRecord>
	pickRange(
		id: string,
		range: QuranRange,
	): Promise<{ khatm: OfflineKhatmRecord; part: OfflineKhatmPartRecord }>
	pickNextAyat(
		id: string,
		count: number,
	): Promise<{
		khatm: OfflineKhatmRecord
		part: OfflineKhatmPartRecord
		range: QuranRange
	}>
	startNextRound(id: string): Promise<OfflineKhatmRecord>
	stopSeries(id: string): Promise<OfflineKhatmRecord>
	delete(id: string): Promise<void>
}

export interface SettingsRepository {
	ready(): Promise<void>
	prepareKey(key: string): string
	get<T>(key: string): T | null
	getOrDefault<T>(key: string, defaultValue: T): T
	set(key: string, value: unknown): Promise<void>
	remove(key: string): Promise<void>
	reloadFromBrowser(key: string): void
}

export interface ClientDatabaseStorage {
	ready(): Promise<void>
	createdKhatms: CreatedKhatmRepository
	pickedKhatmParts: PickedKhatmPartRepository
	localZekrs: LocalZekrRepository
	offlineKhatms: OfflineKhatmRepository
}

export interface ClientStorage extends ClientDatabaseStorage {
	settings: SettingsRepository
}
