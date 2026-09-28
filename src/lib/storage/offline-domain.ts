import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { OfflineKhatmPartRecord, RangeType } from '$lib/contracts/domain'
import { QuranRange } from '$lib/entity/Range'
import { roundPercent } from '$lib/utility/percent'

export class OfflineKhatmNotFoundError extends Error {}
export class OfflineKhatmConflictError extends Error {}
export class OfflineKhatmRangeLockedError extends Error {}

export type CreateOfflineKhatmInput = {
	title: string
	description: string
	rangeType: RangeType
	series: boolean
}

export function normalizeOfflineKhatmInput(input: CreateOfflineKhatmInput) {
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
