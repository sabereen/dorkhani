import type { RangeType } from '@prisma-client'
import type { KhatmData } from './KhatmData'

export const KHATM_DIRECTORY_VIEWS = ['recent', 'progress', 'continuous'] as const
export type KhatmDirectoryView = (typeof KHATM_DIRECTORY_VIEWS)[number]

export const KHATM_DIRECTORY_RANGE_TYPES = [
	'free',
	'page',
	'hizbQuarter',
	'surah',
	'juz',
	'ayah',
] as const satisfies readonly RangeType[]

export type KhatmDirectoryFilters = {
	view: KhatmDirectoryView
	q: string
	rangeType?: RangeType
}

export type KhatmDirectoryQuery = KhatmDirectoryFilters & {
	cursor?: string
}

export type KhatmDirectoryResult = {
	list: KhatmData[]
	nextCursor: string | null
}

export function khatmDirectory_parseSearchParams(
	searchParams: URLSearchParams,
): KhatmDirectoryQuery {
	const requestedView = searchParams.get('view')
	const view = KHATM_DIRECTORY_VIEWS.includes(requestedView as KhatmDirectoryView)
		? (requestedView as KhatmDirectoryView)
		: 'recent'
	const requestedRangeType = searchParams.get('rangeType')
	const rangeType = KHATM_DIRECTORY_RANGE_TYPES.includes(requestedRangeType as RangeType)
		? (requestedRangeType as RangeType)
		: undefined
	const q = (searchParams.get('q') || '').trim()
	const cursor = searchParams.get('cursor') || undefined

	return { view, q, rangeType, cursor }
}
