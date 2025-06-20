import { db } from '$lib/server/db'

export async function zekrService_getList(ids: ReadonlyArray<number>) {
	const khatms = await db.tZekr.findMany({
		where: { id: { in: ids as number[] } },
		orderBy: { id: 'desc' },
	})
	return khatms
}

type CreatingZekr = {
	title: string
	description: string
	targetCount?: number
	zekrText?: string
}
export async function zekrService_create(data: CreatingZekr) {
	const khatm = await db.tZekr.create({
		data,
	})
	return khatm
}

export async function zekrService_get(id: number) {
	const khatm = await db.tZekr.findUnique({
		where: { id },
	})

	return khatm
}
