import type { Prisma } from '@prisma-client'
import { db } from '$lib/server/db'

const DAILY_WINDOW = 7
const TEHRAN_TIME_ZONE = 'Asia/Tehran'

export type LandingStatistics = {
	totals: {
		recitedAyahs: number
		completedRounds: number
	}
	daily: Array<{
		date: string
		recitedAyahs: number
		createdKhatms: number
		completedRounds: number
	}>
}

export type StatisticsDelta = {
	recitedAyahs?: number
	createdKhatms?: number
	completedRounds?: number
}

type StatisticsCache = {
	day: string | null
	value: LandingStatistics | null
	loading: Promise<LandingStatistics> | null
	revision: number
}

const globalForStatistics = globalThis as unknown as {
	landingStatisticsCache?: StatisticsCache
}

const statisticsCache = globalForStatistics.landingStatisticsCache ?? {
	day: null,
	value: null,
	loading: null,
	revision: 0,
}

globalForStatistics.landingStatisticsCache = statisticsCache

export function statisticsService_getTehranDay(now = new Date()) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: TEHRAN_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now)
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
	return `${values.year}-${values.month}-${values.day}`
}

function shiftDay(day: string, offset: number) {
	const date = new Date(`${day}T00:00:00.000Z`)
	date.setUTCDate(date.getUTCDate() + offset)
	return date.toISOString().slice(0, 10)
}

function toDatabaseDate(day: string) {
	return new Date(`${day}T00:00:00.000Z`)
}

function normalizeDelta(delta: StatisticsDelta) {
	return {
		recitedAyahs: Math.max(0, Math.floor(delta.recitedAyahs || 0)),
		createdKhatms: Math.max(0, Math.floor(delta.createdKhatms || 0)),
		completedRounds: Math.max(0, Math.floor(delta.completedRounds || 0)),
	}
}

export async function statisticsService_increment(
	tx: Prisma.TransactionClient,
	delta: StatisticsDelta,
	occurredAt = new Date(),
) {
	const normalized = normalizeDelta(delta)
	const day = statisticsService_getTehranDay(occurredAt)

	if (normalized.recitedAyahs > 0 || normalized.completedRounds > 0) {
		await tx.$executeRaw`
			INSERT INTO system_statistics (
				id,
				total_recited_ayahs,
				total_completed_rounds
			)
			VALUES (
				1,
				${BigInt(normalized.recitedAyahs)},
				${BigInt(normalized.completedRounds)}
			)
			ON DUPLICATE KEY UPDATE
				total_recited_ayahs = total_recited_ayahs + VALUES(total_recited_ayahs),
				total_completed_rounds = total_completed_rounds + VALUES(total_completed_rounds)
		`
	}

	await tx.$executeRaw`
		INSERT INTO daily_statistics (
			day,
			recited_ayahs,
			created_khatms,
			completed_rounds
		)
		VALUES (
			${day},
			${BigInt(normalized.recitedAyahs)},
			${BigInt(normalized.createdKhatms)},
			${BigInt(normalized.completedRounds)}
		)
		ON DUPLICATE KEY UPDATE
			recited_ayahs = recited_ayahs + VALUES(recited_ayahs),
			created_khatms = created_khatms + VALUES(created_khatms),
			completed_rounds = completed_rounds + VALUES(completed_rounds)
	`
}

async function readStatistics(day: string): Promise<LandingStatistics> {
	const firstDay = shiftDay(day, -(DAILY_WINDOW - 1))
	const [totals, rows] = await Promise.all([
		db.tSystemStatistics.findUnique({ where: { id: 1 } }),
		db.tDailyStatistics.findMany({
			where: {
				day: {
					gte: toDatabaseDate(firstDay),
					lte: toDatabaseDate(day),
				},
			},
			orderBy: { day: 'asc' },
		}),
	])
	const rowsByDay = new Map(rows.map((row) => [row.day.toISOString().slice(0, 10), row]))

	return {
		totals: {
			recitedAyahs: Number(totals?.totalRecitedAyahs || 0),
			completedRounds: Number(totals?.totalCompletedRounds || 0),
		},
		daily: Array.from({ length: DAILY_WINDOW }, (_, index) => {
			const date = shiftDay(firstDay, index)
			const row = rowsByDay.get(date)
			return {
				date,
				recitedAyahs: Number(row?.recitedAyahs || 0),
				createdKhatms: Number(row?.createdKhatms || 0),
				completedRounds: Number(row?.completedRounds || 0),
			}
		}),
	}
}

async function loadStableStatistics(day: string): Promise<LandingStatistics> {
	while (statisticsCache.day === day) {
		const revision = statisticsCache.revision
		const value = await readStatistics(day)
		if (statisticsCache.day === day && statisticsCache.revision === revision) {
			statisticsCache.value = value
			return value
		}
	}

	return statisticsService_getLandingStatistics()
}

export async function statisticsService_getLandingStatistics(now = new Date()) {
	const day = statisticsService_getTehranDay(now)
	if (statisticsCache.day !== day) {
		statisticsCache.day = day
		statisticsCache.value = null
		statisticsCache.loading = null
		statisticsCache.revision += 1
	}

	if (statisticsCache.value) return statisticsCache.value
	if (statisticsCache.loading) return statisticsCache.loading

	const loading = loadStableStatistics(day)
	statisticsCache.loading = loading
	try {
		return await loading
	} finally {
		if (statisticsCache.loading === loading) statisticsCache.loading = null
	}
}

export function statisticsService_applyCommitted(
	delta: StatisticsDelta,
	occurredAt = new Date(),
) {
	const normalized = normalizeDelta(delta)
	const day = statisticsService_getTehranDay(occurredAt)
	statisticsCache.revision += 1

	if (statisticsCache.day !== day) {
		statisticsCache.day = day
		statisticsCache.value = null
		statisticsCache.loading = null
		return
	}

	if (!statisticsCache.value) return
	const dailyIndex = statisticsCache.value.daily.findIndex((item) => item.date === day)
	const daily = statisticsCache.value.daily.map((item, index) =>
		index === dailyIndex
			? {
					...item,
					recitedAyahs: item.recitedAyahs + normalized.recitedAyahs,
					createdKhatms: item.createdKhatms + normalized.createdKhatms,
					completedRounds: item.completedRounds + normalized.completedRounds,
				}
			: item,
	)

	statisticsCache.value = {
		totals: {
			recitedAyahs:
				statisticsCache.value.totals.recitedAyahs + normalized.recitedAyahs,
			completedRounds:
				statisticsCache.value.totals.completedRounds + normalized.completedRounds,
		},
		daily,
	}
}

export function statisticsService_resetCache() {
	statisticsCache.day = null
	statisticsCache.value = null
	statisticsCache.loading = null
	statisticsCache.revision += 1
}
