import type { RangeType, ReviewStatus, TKhatm } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { db } from '$lib/server/db'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'

export async function khatmService_getPublicList({ limit = 20 } = {}) {
	const khatms = await db.tKhatm.findMany({
		where: {
			private: false,
			OR: [{ seriesId: { not: null }, status: 'inProgress' }, { seriesId: null }],
		},
		orderBy: { id: 'desc' },
		take: limit,
	})

	return khatms
}

export async function khatmService_getBulk(ids: ReadonlyArray<number>) {
	const khatms = await db.tKhatm.findMany({
		where: { id: { in: ids as number[] } },
		orderBy: { id: 'desc' },
	})
	return khatms
}

type CreatingKhatm = {
	title: string
	description: string
	rangeType: RangeType
	private: boolean
}
export async function khatmService_create(body: CreatingKhatm) {
	const accessToken = body.private ? uuid().split('-').pop() : null
	const khatm = await db.tKhatm.create({
		data: { ...body, accessToken },
	})
	return khatm
}

export async function khatmService_getList(reviewStatus: ReviewStatus, pageID?: number) {
	const khatms = await db.tKhatm.findMany({
		where: {
			private: false,
			reviewStatus: { equals: reviewStatus },
			id: { lt: pageID },
		},
		take: 30,
		orderBy: { id: 'desc' },
	})
	return khatms
}

export async function khatmService_getFull(id: number, accessToken: string | null) {
	const khatm = await db.tKhatm.findUnique({
		include: { parts: true, series: true },
		where: { id, accessToken: { equals: accessToken } },
	})

	return khatm
}

export async function khatmService_update(id: number, khatm: Partial<TKhatm>) {
	const result = await db.tKhatm.update({
		where: { id },
		data: khatm,
	})

	return result
}

export async function khatmService_getBySeries(seriesId: number, accessToken: string | null) {
	const khatm = await db.tKhatm.findFirst({
		include: { parts: true, series: true },
		where: {
			seriesId,
			accessToken: { equals: accessToken },
			status: 'inProgress',
		},
	})

	return khatm
}

export async function khatmService_setAsCompleted(id: number) {
	const result = await db.tKhatm.update({
		where: { id },
		include: { series: true },
		data: {
			status: 'completed',
			endDate: new Date(),
		},
	})

	const { series, roundNumber } = result

	if (!series) return
	if (series.maxRounds && roundNumber >= series.maxRounds) return

	await db.tKhatm.create({
		data: {
			title: result.title,
			description: result.description,
			accessToken: result.accessToken,
			private: result.private,
			rangeType: result.rangeType,
			seriesId: result.seriesId,
			roundNumber: roundNumber + 1,
		},
	})
}

export async function khatmService_checkAndUpdateStatus() {
	const result = await db.tKhatm.findMany({
		select: { id: true },
		where: {
			status: 'inProgress',
			versesRead: { gte: COUNT_OF_AYAHS },
		},
	})

	result.forEach((khatm) => {
		khatmService_setAsCompleted(khatm.id)
	})

	return { count: result.length }
}
