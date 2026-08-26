import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type {
	OfflineKhatmPartRecord,
	OfflineKhatmRecord,
	RangeType,
} from '$lib/contracts/domain'
import { QuranRange } from '$lib/entity/Range'
import { roundPercent } from '$lib/utility/percent'
import { v4 as uuid } from 'uuid'

export class OfflineKhatmNotFoundError extends Error {}
export class OfflineKhatmConflictError extends Error {}
export class OfflineKhatmRangeLockedError extends Error {}

export type CreateOfflineKhatmInput = {
	title: string
	description: string
	rangeType: RangeType
	series: boolean
}

function normalizedInput(input: CreateOfflineKhatmInput) {
	const title = input.title.trim()
	if (!title || title.length > 100) throw new Error('عنوان ختم معتبر نیست.')
	if (input.description.length > 65535) throw new Error('توضیحات ختم بیش از حد طولانی است.')
	return { ...input, title }
}

export function calculateOfflineKhatmProgress(parts: OfflineKhatmPartRecord[]) {
	const ranges = parts
		.map((part) => ({ start: part.start, end: part.end }))
		.sort((a, b) => a.start - b.start)
	const merged: Array<{ start: number; end: number }> = []
	for (const range of ranges) {
		const previous = merged[merged.length - 1]
		if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
		else merged.push({ ...range })
	}
	const versesRead = merged.reduce((sum, range) => sum + range.end - range.start, 0)
	const rawProgress = merged.reduce(
		(sum, range) => sum + new QuranRange(range.start, range.end).getCoveragePercent() * 100,
		0,
	)
	return {
		versesRead,
		pageProgress: versesRead >= COUNT_OF_AYAHS ? 100 : roundPercent(rawProgress, false),
	}
}

export function offlineKhatmRangesOverlap(
	first: Pick<OfflineKhatmPartRecord, 'start' | 'end'>,
	second: Pick<OfflineKhatmPartRecord, 'start' | 'end'>,
) {
	return first.start < second.end && second.start < first.end
}

async function getRequired(id: string) {
	const { db } = await import('./idb')
	const khatm = await db.offlineKhatms.get(id)
	if (!khatm) throw new OfflineKhatmNotFoundError('ختم آفلاین پیدا نشد.')
	return khatm
}

export async function idb_offlineKhatm_create(input: CreateOfflineKhatmInput) {
	const { db } = await import('./idb')
	const normalized = normalizedInput(input)
	const now = new Date()
	const khatm: OfflineKhatmRecord = {
		id: uuid(),
		...normalized,
		seriesStopped: false,
		roundNumber: 1,
		roundCreated: now,
		status: 'inProgress',
		versesRead: 0,
		pageProgress: 0,
		created: now,
		updated: now,
		endDate: null,
		completedRounds: [],
	}
	await db.offlineKhatms.add(khatm)
	return khatm
}

export async function idb_offlineKhatm_get(id: string) {
	return getRequired(id)
}

export async function idb_offlineKhatm_getList() {
	const { db } = await import('./idb')
	return db.offlineKhatms.orderBy('updated').reverse().toArray()
}

export async function idb_offlineKhatm_getParts(id: string, roundNumber?: number) {
	const khatm = roundNumber == null ? await getRequired(id) : null
	const { db } = await import('./idb')
	return db.offlineKhatmParts
		.where('[khatmId+roundNumber]')
		.equals([id, roundNumber ?? khatm!.roundNumber])
		.sortBy('start')
}

export async function idb_offlineKhatm_update(
	id: string,
	input: Pick<CreateOfflineKhatmInput, 'title' | 'description' | 'rangeType'>,
) {
	const normalized = normalizedInput({ ...input, series: false })
	const { db } = await import('./idb')
	return db.transaction('rw', db.offlineKhatms, async () => {
		const current = await db.offlineKhatms.get(id)
		if (!current) throw new OfflineKhatmNotFoundError('ختم آفلاین پیدا نشد.')
		if (current.versesRead > 0 && current.rangeType !== normalized.rangeType) {
			throw new OfflineKhatmRangeLockedError('پس از شروع ختم، نوع تقسیم قابل تغییر نیست.')
		}
		const updated = { ...normalized, series: current.series, updated: new Date() }
		await db.offlineKhatms.update(id, updated)
		return { ...current, ...updated }
	})
}

export async function idb_offlineKhatm_pickRange(id: string, range: QuranRange) {
	if (
		!Number.isInteger(range.start) ||
		!Number.isInteger(range.end) ||
		range.start < 0 ||
		range.end > COUNT_OF_AYAHS ||
		range.start >= range.end
	) {
		throw new Error('بازهٔ انتخاب‌شده معتبر نیست.')
	}

	const { db } = await import('./idb')
	return db.transaction('rw', db.offlineKhatms, db.offlineKhatmParts, async () => {
		const khatm = await db.offlineKhatms.get(id)
		if (!khatm) throw new OfflineKhatmNotFoundError('ختم آفلاین پیدا نشد.')
		if (khatm.status === 'completed') throw new Error('این دور از ختم کامل شده است.')
		const parts = await db.offlineKhatmParts
			.where('[khatmId+roundNumber]')
			.equals([id, khatm.roundNumber])
			.toArray()
		if (parts.some((part) => offlineKhatmRangesOverlap(part, range))) {
			throw new OfflineKhatmConflictError('این بازه قبلاً خوانده شده است.')
		}

		const part: OfflineKhatmPartRecord = {
			id: uuid(),
			khatmId: id,
			roundNumber: khatm.roundNumber,
			start: range.start,
			end: range.end,
			created: new Date(),
		}
		await db.offlineKhatmParts.add(part)
		const progress = calculateOfflineKhatmProgress([...parts, part])
		const completed = progress.versesRead >= COUNT_OF_AYAHS
		const now = new Date()
		const update: Partial<OfflineKhatmRecord> = {
			...progress,
			updated: now,
			status: completed ? 'completed' : 'inProgress',
			endDate: completed ? now : null,
			completedRounds: completed
				? [
						...khatm.completedRounds.filter(
							(round) => round.roundNumber !== khatm.roundNumber,
						),
						{ roundNumber: khatm.roundNumber, created: khatm.roundCreated, completed: now },
					]
				: khatm.completedRounds,
		}
		await db.offlineKhatms.update(id, update)
		return { khatm: { ...khatm, ...update }, part }
	})
}

export async function idb_offlineKhatm_pickNextAyat(id: string, count: number) {
	const khatm = await getRequired(id)
	if (khatm.rangeType !== 'ayah') throw new Error('این ختم از نوع آیه‌ای نیست.')
	const safeCount = Math.max(1, Math.min(1000, Math.floor(count)))
	const start = Math.min(khatm.versesRead, COUNT_OF_AYAHS)
	const range = new QuranRange(start, Math.min(COUNT_OF_AYAHS, start + safeCount))
	if (!range.length) throw new Error('این دور از ختم کامل شده است.')
	const result = await idb_offlineKhatm_pickRange(id, range)
	return { ...result, range }
}

export async function idb_offlineKhatm_startNextRound(id: string) {
	const { db } = await import('./idb')
	return db.transaction('rw', db.offlineKhatms, async () => {
		const khatm = await db.offlineKhatms.get(id)
		if (!khatm) throw new OfflineKhatmNotFoundError('ختم آفلاین پیدا نشد.')
		if (!khatm.series || khatm.seriesStopped || khatm.status !== 'completed') {
			throw new Error('شروع دور جدید برای این ختم ممکن نیست.')
		}
		const now = new Date()
		const update: Partial<OfflineKhatmRecord> = {
			roundNumber: khatm.roundNumber + 1,
			roundCreated: now,
			status: 'inProgress',
			versesRead: 0,
			pageProgress: 0,
			updated: now,
			endDate: null,
		}
		await db.offlineKhatms.update(id, update)
		return { ...khatm, ...update }
	})
}

export async function idb_offlineKhatm_stopSeries(id: string) {
	const { db } = await import('./idb')
	const khatm = await getRequired(id)
	if (!khatm.series) return khatm
	const update = { seriesStopped: true, updated: new Date() }
	await db.offlineKhatms.update(id, update)
	return { ...khatm, ...update }
}

export async function idb_offlineKhatm_delete(id: string) {
	const { db } = await import('./idb')
	await db.transaction('rw', db.offlineKhatms, db.offlineKhatmParts, async () => {
		await db.offlineKhatmParts.where('khatmId').equals(id).delete()
		await db.offlineKhatms.delete(id)
	})
}
