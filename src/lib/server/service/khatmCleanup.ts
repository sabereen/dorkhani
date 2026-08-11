import type { Prisma } from '@prisma-client'
import { db } from '$lib/server/db'
import { appSettings_store } from './appSettings'

const DAY_MS = 24 * 60 * 60 * 1000
const CLEANUP_INTERVAL_MS = DAY_MS
const CLEANUP_BATCH_SIZE = 100

type CleanupOptions = {
	now?: Date
	retentionDays?: number
	batchSize?: number
}

function getExpiredUnstartedWhere(cutoff: Date): Prisma.TKhatmWhereInput {
	return {
		status: 'inProgress',
		versesRead: 0,
		created: { lte: cutoff },
		OR: [{ seriesId: null }, { roundNumber: 1 }],
	}
}

export async function khatmCleanup_deleteExpiredUnstarted({
	now = new Date(),
	retentionDays = appSettings_store.config.staleKhatmRetentionDays,
	batchSize = CLEANUP_BATCH_SIZE,
}: CleanupOptions = {}) {
	const cutoff = new Date(now.getTime() - retentionDays * DAY_MS)
	const take = Math.max(1, Math.floor(batchSize))
	let lastId = 0
	let count = 0

	while (true) {
		const candidates = await db.tKhatm.findMany({
			where: {
				...getExpiredUnstartedWhere(cutoff),
				id: { gt: lastId },
			},
			select: { id: true, seriesId: true },
			orderBy: { id: 'asc' },
			take,
		})

		if (candidates.length === 0) break
		lastId = candidates[candidates.length - 1].id

		for (const candidate of candidates) {
			const deleted = await db.$transaction(async (tx) => {
				const result = await tx.tKhatm.deleteMany({
					where: {
						...getExpiredUnstartedWhere(cutoff),
						id: candidate.id,
					},
				})
				if (result.count === 0) return false

				await tx.tKhatmDeletion.create({
					data: {
						khatmId: candidate.id,
						seriesId: candidate.seriesId,
						reason: 'expiredUnstarted',
					},
				})

				if (candidate.seriesId != null) {
					await tx.tKhatmSeries.deleteMany({
						where: {
							id: candidate.seriesId,
							khatms: { none: {} },
						},
					})
				}

				return true
			})

			if (deleted) count += 1
		}

		if (candidates.length < take) break
	}

	return { count }
}

type CleanupSchedulerState = {
	started: boolean
	activeCleanup: Promise<void> | null
}

const globalForKhatmCleanup = globalThis as unknown as {
	khatmCleanupScheduler?: CleanupSchedulerState
}
const schedulerState = globalForKhatmCleanup.khatmCleanupScheduler ?? {
	started: false,
	activeCleanup: null,
}
globalForKhatmCleanup.khatmCleanupScheduler = schedulerState

function runScheduledCleanup() {
	if (schedulerState.activeCleanup) return

	schedulerState.activeCleanup = khatmCleanup_deleteExpiredUnstarted()
		.then(() => undefined)
		.catch((error) => {
			console.error('Failed to remove expired unstarted khatms.', error)
		})
		.finally(() => {
			schedulerState.activeCleanup = null
		})
}

export function khatmCleanup_startScheduler() {
	if (schedulerState.started) return
	schedulerState.started = true

	runScheduledCleanup()
	const interval = setInterval(runScheduledCleanup, CLEANUP_INTERVAL_MS)
	interval.unref?.()
}
