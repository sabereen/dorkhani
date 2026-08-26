import { db } from '$lib/server/db'

export async function zekrService_getList(ids: ReadonlyArray<number>) {
	const zekrList = await db.tZekr.findMany({
		where: { id: { in: ids as number[] } },
		orderBy: { id: 'desc' },
	})
	return zekrList
}

export async function zekrService_getPublicList({ limit = 20 } = {}) {
	const zekrList = await db.tZekr.findMany({
		orderBy: { id: 'desc' },
		take: limit,
	})

	return zekrList
}

export async function zekrService_countSitemapEntries() {
	return db.tZekr.count()
}

export async function zekrService_getSitemapEntries({ skip, take }: { skip: number; take: number }) {
	return db.tZekr.findMany({
		select: { id: true },
		orderBy: { id: 'asc' },
		skip,
		take,
	})
}

type CreatingZekr = {
	title: string
	description: string
	targetCount?: number
	zekrText?: string
}
export async function zekrService_create(data: CreatingZekr) {
	const zekr = await db.tZekr.create({
		data,
	})
	return zekr
}

export async function zekrService_pick(data: { count: number; id: number }) {
	const zekr = await db.tZekr.update({
		where: { id: data.id },
		data: { count: { increment: data.count } },
	})
	return zekr
}

export async function zekrService_get(id: number) {
	const zekr = await db.tZekr.findUnique({
		where: { id },
	})

	return zekr
}
