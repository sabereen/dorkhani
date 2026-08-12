import type {
	Prisma,
	RangeType,
	ReviewStatus,
	TKhatm,
	TKhatmSeries,
} from '@prisma-client'
import { createHash, randomBytes } from 'node:crypto'
import { v4 as uuid } from 'uuid'
import { db } from '$lib/server/db'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { KhatmData } from '$lib/entity/KhatmData'
import type { AdminKhatmListItem, FeaturedKhatmItem } from '$lib/entity/KhatmFeatured'
import type {
	KhatmDirectoryQuery,
	KhatmDirectoryResult,
	KhatmDirectoryView,
} from '$lib/entity/KhatmDirectory'
import {
	statisticsService_applyCommitted,
	statisticsService_increment,
} from './statistics'

type SecretKhatmFields = {
	ownerId?: string | null
	guestClaimTokenHash?: string | null
	series?: unknown
}

export type PublicKhatm = KhatmData

export type KhatmManagementActor =
	| { kind: 'owner'; ownerId: string }
	| { kind: 'admin' }

export class KhatmOwnershipError extends Error {}
export class KhatmRangeLockedError extends Error {}
export class KhatmHistoricalRoundError extends Error {}
export class KhatmFeaturedEligibilityError extends Error {}
export class KhatmFeaturedLimitError extends Error {}
export class KhatmFeaturedOrderError extends Error {}

type KhatmWithSeries = TKhatm & { series: TKhatmSeries | null }

const FEATURED_KHATM_LIMIT = 6

function ensureCanManageKhatm(actor: KhatmManagementActor, ownerId: string | null) {
	if (actor.kind === 'owner' && actor.ownerId !== ownerId) throw new KhatmOwnershipError()
}

export function khatmService_toPublic<T extends TKhatm & SecretKhatmFields>(khatm: T) {
	const {
		ownerId: _ownerId,
		guestClaimTokenHash: _claimHash,
		series: _series,
		...publicKhatm
	} = khatm
	return publicKhatm
}

function hashClaimToken(token: string) {
	return createHash('sha256').update(token).digest('hex')
}

function khatmService_canFeature(khatm: KhatmWithSeries) {
	return Boolean(
		!khatm.private &&
			khatm.reviewStatus === 'approved' &&
			khatm.status === 'inProgress' &&
			khatm.series &&
			khatm.series.maxRounds == null,
	)
}

async function khatmService_unfeatureSeries(
	tx: Prisma.TransactionClient,
	seriesId: number,
) {
	const series = await tx.tKhatmSeries.findUnique({
		where: { id: seriesId },
		select: { featuredOrder: true },
	})
	if (series?.featuredOrder == null) return false

	await tx.tKhatmSeries.update({
		where: { id: seriesId },
		data: { featuredOrder: null },
	})
	await tx.tKhatmSeries.updateMany({
		where: { featuredOrder: { gt: series.featuredOrder } },
		data: { featuredOrder: { decrement: 1 } },
	})
	return true
}

async function khatmService_getFeaturedRows() {
	return db.tKhatm.findMany({
		include: { series: true },
		where: {
			private: false,
			reviewStatus: 'approved',
			status: 'inProgress',
			series: { is: { maxRounds: null, featuredOrder: { not: null } } },
		},
		orderBy: [{ series: { featuredOrder: 'asc' } }, { id: 'desc' }],
		take: FEATURED_KHATM_LIMIT,
	})
}

export async function khatmService_getFeaturedShowcase() {
	const khatms = await khatmService_getFeaturedRows()
	return khatms.map(khatmService_toPublic)
}

export async function khatmService_getFeaturedAdminList(): Promise<FeaturedKhatmItem[]> {
	const khatms = await khatmService_getFeaturedRows()
	return khatms.map((khatm) => ({
		khatm: khatmService_toPublic(khatm),
		featuredOrder: khatm.series!.featuredOrder!,
	}))
}

export async function khatmService_setFeatured(id: number, featured: boolean) {
	await db.$transaction(
		async (tx) => {
			const khatm = await tx.tKhatm.findUnique({ where: { id }, include: { series: true } })
			if (!khatm?.series) throw new KhatmFeaturedEligibilityError()

			if (!featured) {
				await khatmService_unfeatureSeries(tx, khatm.series.id)
				return
			}

			if (!khatmService_canFeature(khatm)) throw new KhatmFeaturedEligibilityError()
			if (khatm.series.featuredOrder != null) return

			const selected = await tx.tKhatmSeries.findMany({
				where: { featuredOrder: { not: null } },
				select: { id: true },
				orderBy: { featuredOrder: 'asc' },
			})
			if (selected.length >= FEATURED_KHATM_LIMIT) throw new KhatmFeaturedLimitError()

			await tx.tKhatmSeries.update({
				where: { id: khatm.series.id },
				data: { featuredOrder: selected.length + 1 },
			})
		},
		{ isolationLevel: 'Serializable' },
	)

	return khatmService_getFeaturedAdminList()
}

export async function khatmService_reorderFeatured(seriesIds: number[]) {
	if (
		seriesIds.length > FEATURED_KHATM_LIMIT ||
		new Set(seriesIds).size !== seriesIds.length ||
		seriesIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
	) {
		throw new KhatmFeaturedOrderError()
	}

	await db.$transaction(
		async (tx) => {
			const selected = await tx.tKhatmSeries.findMany({
				where: { featuredOrder: { not: null } },
				select: { id: true },
			})
			const selectedIds = new Set(selected.map((series) => series.id))
			if (
				selectedIds.size !== seriesIds.length ||
				seriesIds.some((id) => !selectedIds.has(id))
			) {
				throw new KhatmFeaturedOrderError()
			}

			for (const [index, seriesId] of seriesIds.entries()) {
				await tx.tKhatmSeries.update({
					where: { id: seriesId },
					data: { featuredOrder: index + 1 },
				})
			}
		},
		{ isolationLevel: 'Serializable' },
	)

	return khatmService_getFeaturedAdminList()
}

export async function khatmService_getPublicList({ limit = 20 } = {}) {
	const khatms = await db.tKhatm.findMany({
		where: {
			private: false,
			reviewStatus: 'approved',
			AND: [
				{ OR: [{ seriesId: { not: null }, status: 'inProgress' }, { seriesId: null }] },
				{
					OR: [
						{ seriesId: null },
						{ series: { is: { featuredOrder: null } } },
					],
				},
			],
		},
		orderBy: { id: 'desc' },
		take: limit,
	})

	return khatms.map(khatmService_toPublic)
}

const AUTOMATIC_SHOWCASE_WINDOW_MS = 72 * 60 * 60 * 1000

export async function khatmService_getAutomaticShowcase(
	{ limit = 6, now = new Date() }: { limit?: number; now?: Date } = {},
) {
	const take = Math.max(0, Math.floor(limit))
	if (take === 0) return []

	const since = new Date(now.getTime() - AUTOMATIC_SHOWCASE_WINDOW_MS)
	const rankedRecitations = await db.tKhatmRecitation.groupBy({
		by: ['khatmId'],
		where: {
			created: { gte: since },
			khatm: {
				is: {
					private: false,
					reviewStatus: 'approved',
					status: 'inProgress',
					OR: [{ seriesId: null }, { series: { is: { featuredOrder: null } } }],
				},
			},
		},
		_sum: { verseCount: true },
		_max: { created: true },
		orderBy: [
			{ _sum: { verseCount: 'desc' } },
			{ _max: { created: 'desc' } },
			{ khatmId: 'desc' },
		],
		take,
	})

	const rankedIds = rankedRecitations
		.filter((recitation) => (recitation._sum.verseCount || 0) > 0)
		.map((recitation) => recitation.khatmId)
	if (rankedIds.length === 0) return []

	const khatms = await db.tKhatm.findMany({
		where: {
			id: { in: rankedIds },
			private: false,
			reviewStatus: 'approved',
			status: 'inProgress',
			OR: [{ seriesId: null }, { series: { is: { featuredOrder: null } } }],
		},
	})
	const khatmsById = new Map(khatms.map((khatm) => [khatm.id, khatm]))

	return rankedIds
		.map((id) => khatmsById.get(id))
		.filter((khatm): khatm is TKhatm => Boolean(khatm))
		.map(khatmService_toPublic)
}

type CreatingKhatm = {
	title: string
	description: string
	rangeType: RangeType
	private: boolean
}

export async function khatmService_create(body: CreatingKhatm, ownerId?: string | null) {
	const accessToken = body.private ? uuid().split('-').pop() : null
	const guestClaimToken = ownerId ? null : randomBytes(32).toString('base64url')
	const createdAt = new Date()
	const khatm = await db.$transaction(async (tx) => {
		const created = await tx.tKhatm.create({
			data: {
				...body,
				accessToken,
				ownerId: ownerId || null,
				guestClaimTokenHash: guestClaimToken ? hashClaimToken(guestClaimToken) : null,
				created: createdAt,
			},
		})
		await statisticsService_increment(tx, { createdKhatms: 1 }, createdAt)
		return created
	})
	statisticsService_applyCommitted({ createdKhatms: 1 }, createdAt)

	return { khatm: khatmService_toPublic(khatm), guestClaimToken }
}

export async function khatmService_getList(reviewStatus: ReviewStatus, pageID?: number) {
	const khatms = await db.tKhatm.findMany({
		where: {
			private: false,
			reviewStatus: { equals: reviewStatus },
			id: { lt: pageID },
		},
		take: 40,
		orderBy: { id: 'desc' },
	})
	return khatms.map(khatmService_toPublic)
}

type KhatmDirectoryCursor = {
	view: KhatmDirectoryView
	value: number
	id: number
}

function encodeDirectoryCursor(cursor: KhatmDirectoryCursor) {
	return Buffer.from(`${cursor.view}:${cursor.value}:${cursor.id}`, 'utf8').toString('base64url')
}

function decodeDirectoryCursor(value: string | undefined, view: KhatmDirectoryView) {
	if (!value) return null
	try {
		const [cursorView, rawValue, rawId] = Buffer.from(value, 'base64url').toString('utf8').split(':')
		const cursorValue = Number(rawValue)
		const id = Number(rawId)
		const isValidCursorValue =
			cursorView === 'progress'
				? Number.isFinite(cursorValue) && cursorValue >= 0 && cursorValue <= 100
				: Number.isSafeInteger(cursorValue) && cursorValue >= 0
		if (
			cursorView !== view ||
			!isValidCursorValue ||
			!Number.isSafeInteger(id) ||
			id <= 0
		) {
			return null
		}
		return { value: cursorValue, id }
	} catch {
		return null
	}
}

export async function khatmService_getDirectoryList(
	query: KhatmDirectoryQuery,
	{ limit = 40 }: { limit?: number } = {},
): Promise<KhatmDirectoryResult> {
	const take = Math.min(40, Math.max(1, Math.floor(limit)))
	const cursor = decodeDirectoryCursor(query.cursor, query.view)
	const where: Prisma.TKhatmWhereInput = {
		private: false,
		reviewStatus: 'approved',
		...(query.rangeType ? { rangeType: query.rangeType } : {}),
		...(query.q
			? {
					OR: [{ title: { contains: query.q } }, { description: { contains: query.q } }],
				}
			: {}),
	}

	if (query.view === 'recent') {
		if (cursor) where.id = { lt: cursor.id }
	} else if (query.view === 'progress') {
		where.status = 'inProgress'
		if (cursor) {
			where.AND = [
				{
					OR: [
						{ pageProgress: { lt: cursor.value } },
						{ pageProgress: cursor.value, id: { lt: cursor.id } },
					],
				},
			]
		}
	} else {
		where.status = 'inProgress'
		where.series = { is: { maxRounds: null } }
		if (cursor) {
			where.AND = [
				{
					OR: [
						{ roundNumber: { lt: cursor.value } },
						{ roundNumber: cursor.value, id: { lt: cursor.id } },
					],
				},
			]
		}
	}

	const orderBy: Prisma.TKhatmOrderByWithRelationInput[] =
		query.view === 'progress'
			? [{ pageProgress: 'desc' }, { id: 'desc' }]
			: query.view === 'continuous'
				? [{ roundNumber: 'desc' }, { id: 'desc' }]
				: [{ id: 'desc' }]
	const rows = await db.tKhatm.findMany({ where, orderBy, take: take + 1 })
	const hasMore = rows.length > take
	const visibleRows = hasMore ? rows.slice(0, take) : rows
	const last = visibleRows.at(-1)
	const value = last
		? query.view === 'progress'
			? last.pageProgress
			: query.view === 'continuous'
				? last.roundNumber
				: last.id
		: null

	return {
		list: visibleRows.map(khatmService_toPublic),
		nextCursor:
			hasMore && last && value != null
				? encodeDirectoryCursor({ view: query.view, value, id: last.id })
				: null,
	}
}

export async function khatmService_getFullRecord(
	id: number,
	accessToken: string | null,
	{ bypassAccessToken = false }: { bypassAccessToken?: boolean } = {},
) {
	return db.tKhatm.findUnique({
		include: { parts: true, series: true },
		where: bypassAccessToken ? { id } : { id, accessToken: { equals: accessToken } },
	})
}

export async function khatmService_getAdminList(
	reviewStatus: ReviewStatus,
	pageID?: number,
): Promise<AdminKhatmListItem[]> {
	const khatms = await db.tKhatm.findMany({
		include: { series: true },
		where: {
			private: false,
			reviewStatus: { equals: reviewStatus },
			id: { lt: pageID },
		},
		take: 40,
		orderBy: { id: 'desc' },
	})

	return khatms.map((khatm) => ({
		khatm: khatmService_toPublic(khatm),
		featuredOrder:
			khatm.status === 'inProgress' ? (khatm.series?.featuredOrder ?? null) : null,
		canFeature: Boolean(
			!khatm.private &&
				khatm.status === 'inProgress' &&
				khatm.series &&
				khatm.series.maxRounds == null,
		),
	}))
}

export async function khatmService_getFull(id: number, accessToken: string | null) {
	const khatm = await khatmService_getFullRecord(id, accessToken)
	return khatm ? khatmService_toPublic(khatm) : null
}

export async function khatmService_update(id: number, khatm: Partial<TKhatm>) {
	return db.$transaction(async (tx) => {
		const current = await tx.tKhatm.findUnique({ where: { id } })
		if (!current) return null
		const result = await tx.tKhatm.update({ where: { id }, data: khatm })
		if (current.seriesId != null && khatm.reviewStatus && khatm.reviewStatus !== 'approved') {
			await khatmService_unfeatureSeries(tx, current.seriesId)
		}
		return khatmService_toPublic(result)
	})
}

export async function khatmService_getBySeriesRecord(
	seriesId: number,
	accessToken: string | null,
	{ bypassAccessToken = false }: { bypassAccessToken?: boolean } = {},
) {
	return db.tKhatm.findFirst({
		include: { parts: true, series: true },
		where: {
			seriesId,
			...(bypassAccessToken ? {} : { accessToken: { equals: accessToken } }),
			status: 'inProgress',
		},
	})
}

export async function khatmService_getBySeries(seriesId: number, accessToken: string | null) {
	const khatm = await khatmService_getBySeriesRecord(seriesId, accessToken)
	return khatm ? khatmService_toPublic(khatm) : null
}

export async function khatmService_getOwnedList(ownerId: string) {
	const khatms = await db.tKhatm.findMany({
		where: { ownerId },
		orderBy: [{ seriesId: 'asc' }, { roundNumber: 'desc' }, { id: 'desc' }],
	})
	const seenSeries = new Set<number>()

	return khatms
		.filter((khatm) => {
			if (khatm.seriesId == null) return true
			if (seenSeries.has(khatm.seriesId)) return false
			seenSeries.add(khatm.seriesId)
			return true
		})
		.map(khatmService_toPublic)
}

export async function khatmService_getForEdit(actor: KhatmManagementActor, id: number) {
	const khatm = await db.tKhatm.findUnique({
		where: { id },
		include: { _count: { select: { parts: true } }, series: true },
	})
	if (!khatm) return null
	ensureCanManageKhatm(actor, khatm.ownerId)
	if (
		khatm.seriesId != null &&
		(await db.tKhatm.findFirst({
			where: { seriesId: khatm.seriesId, roundNumber: { gt: khatm.roundNumber } },
			select: { id: true },
		}))
	) {
		throw new KhatmHistoricalRoundError()
	}

	return {
		khatm: khatmService_toPublic(khatm),
		canChangeRange: khatm.versesRead === 0 && khatm._count.parts === 0,
		canDisableSeries: Boolean(khatm.series && khatm.series.maxRounds == null),
	}
}

export async function khatmService_claimGuestKhatms(
	ownerId: string,
	claims: ReadonlyArray<{ id: number; token: string }>,
) {
	const claimedIds: number[] = []
	await db.$transaction(async (tx) => {
		for (const claim of claims.slice(0, 100)) {
			const khatm = await tx.tKhatm.findUnique({ where: { id: claim.id } })
			if (!khatm || khatm.ownerId || !khatm.guestClaimTokenHash) continue
			const claimHash = hashClaimToken(claim.token)
			if (claimHash !== khatm.guestClaimTokenHash) continue

			const updated = await tx.tKhatm.updateMany({
				where:
					khatm.seriesId == null
						? { id: khatm.id, ownerId: null, guestClaimTokenHash: claimHash }
						: { seriesId: khatm.seriesId, ownerId: null, guestClaimTokenHash: claimHash },
				data: { ownerId, guestClaimTokenHash: null },
			})
			if (updated.count > 0) claimedIds.push(claim.id)
		}
	})

	return claimedIds
}

type EditingKhatm = {
	title: string
	description: string
	rangeType: RangeType
	private: boolean
	disableSeries: boolean
}

export async function khatmService_edit(
	actor: KhatmManagementActor,
	id: number,
	input: EditingKhatm,
) {
	return db.$transaction(async (tx) => {
		const current = await tx.tKhatm.findUnique({
			where: { id },
			include: { _count: { select: { parts: true } }, series: true },
		})
		if (!current) return null
		ensureCanManageKhatm(actor, current.ownerId)
		if (
			current.seriesId != null &&
			(await tx.tKhatm.findFirst({
				where: { seriesId: current.seriesId, roundNumber: { gt: current.roundNumber } },
				select: { id: true },
			}))
		) {
			throw new KhatmHistoricalRoundError()
		}

		const rangeChanged = current.rangeType !== input.rangeType
		if (rangeChanged && (current.versesRead > 0 || current._count.parts > 0)) {
			throw new KhatmRangeLockedError()
		}

		let accessToken = current.accessToken
		if (input.private && !current.private) accessToken = uuid().split('-').pop() || uuid()
		if (!input.private) accessToken = null

		if (current.seriesId != null && input.private !== current.private) {
			await tx.tKhatm.updateMany({
				where: { seriesId: current.seriesId },
				data: { private: input.private, accessToken },
			})
		}

		if (current.series && input.disableSeries && current.series.maxRounds == null) {
			await tx.tKhatmSeries.update({
				where: { id: current.series.id },
				data: { maxRounds: current.roundNumber },
			})
		}

		const contentChanged =
			current.title !== input.title ||
			current.description !== input.description ||
			current.rangeType !== input.rangeType
		const reviewStatus =
			actor.kind === 'owner' && !input.private && (contentChanged || current.private)
				? ('pending' as const)
				: current.reviewStatus
		if (
			current.seriesId != null &&
			(input.private || input.disableSeries || reviewStatus !== 'approved')
		) {
			await khatmService_unfeatureSeries(tx, current.seriesId)
		}
		const updated = await tx.tKhatm.update({
			where: { id },
			data: {
				title: input.title,
				description: input.description,
				rangeType: input.rangeType,
				private: input.private,
				accessToken,
				reviewStatus,
			},
		})

		return khatmService_toPublic(updated)
	})
}

export async function khatmService_delete(actor: KhatmManagementActor, id: number) {
	return db.$transaction(async (tx) => {
		const current = await tx.tKhatm.findUnique({ where: { id } })
		if (!current) return false
		ensureCanManageKhatm(actor, current.ownerId)

		const khatms = current.seriesId
			? await tx.tKhatm.findMany({ where: { seriesId: current.seriesId }, select: { id: true } })
			: [{ id: current.id }]
		await tx.tKhatmDeletion.createMany({
			data: khatms.map((khatm) => ({
				khatmId: khatm.id,
				seriesId: current.seriesId,
				reason: actor.kind,
			})),
		})
		if (current.seriesId) await khatmService_unfeatureSeries(tx, current.seriesId)
		await tx.tKhatm.deleteMany({ where: { id: { in: khatms.map((khatm) => khatm.id) } } })
		if (current.seriesId) await tx.tKhatmSeries.delete({ where: { id: current.seriesId } })
		return true
	})
}

export async function khatmService_stopOwnedSeries(ownerId: string, id: number) {
	return db.$transaction(async (tx) => {
		const current = await tx.tKhatm.findUnique({ where: { id }, include: { series: true } })
		if (!current) return null
		if (current.ownerId !== ownerId) throw new KhatmOwnershipError()
		if (!current.series) return false
		if (current.series.maxRounds != null) return true

		const newerRound = await tx.tKhatm.findFirst({
			where: { seriesId: current.series.id, roundNumber: { gt: current.roundNumber } },
			select: { id: true },
		})
		if (newerRound) throw new KhatmHistoricalRoundError()

		await tx.tKhatmSeries.updateMany({
			where: { id: current.series.id, maxRounds: null },
			data: { maxRounds: current.roundNumber },
		})
		await khatmService_unfeatureSeries(tx, current.series.id)
		return true
	})
}

export async function khatmService_getDeletionReason(id: number, isSeries = false) {
	const deletion = isSeries
		? await db.tKhatmDeletion.findFirst({ where: { seriesId: id }, select: { reason: true } })
		: await db.tKhatmDeletion.findUnique({ where: { khatmId: id }, select: { reason: true } })

	return deletion?.reason || null
}

export async function khatmService_setAsCompleted(id: number) {
	const completedAt = new Date()
	const completed = await db.$transaction(async (tx) => {
		const current = await tx.tKhatm.findUnique({
			where: { id },
			include: { series: true },
		})
		if (!current || current.status === 'completed') return false

		const result = await tx.tKhatm.updateMany({
			where: { id, status: 'inProgress' },
			data: { status: 'completed', endDate: completedAt, pageProgress: 100 },
		})
		if (result.count === 0) return false
		await statisticsService_increment(tx, { completedRounds: 1 }, completedAt)

		const { series, roundNumber } = current
		if (!series) return true
		if (series.maxRounds && roundNumber >= series.maxRounds) return true

		await tx.tKhatm.create({
			data: {
				title: current.title,
				description: current.description,
				accessToken: current.accessToken,
				private: current.private,
				rangeType: current.rangeType,
				seriesId: current.seriesId,
				roundNumber: roundNumber + 1,
				ownerId: current.ownerId,
				guestClaimTokenHash: current.guestClaimTokenHash,
				...(series.featuredOrder != null ? { reviewStatus: 'approved' as const } : {}),
			},
		})
		return true
	})
	if (completed) statisticsService_applyCommitted({ completedRounds: 1 }, completedAt)
}

export async function khatmService_checkAndUpdateStatus() {
	const result = await db.tKhatm.findMany({
		select: { id: true },
		where: { status: 'inProgress', versesRead: { gte: COUNT_OF_AYAHS } },
	})
	await Promise.all(result.map((khatm) => khatmService_setAsCompleted(khatm.id)))
	return { count: result.length }
}
