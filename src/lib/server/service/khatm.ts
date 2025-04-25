import type { RangeType } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { db } from '$lib/server/db'

export async function khatmService_getPublicList({ limit = 20 } = {}) {
	const khatms = await db.tKhatm.findMany({
		where: { private: false },
		orderBy: { id: 'desc' },
		take: limit,
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

export async function khatmService_getFull(id: number, accessToken: string | null) {
	const khatm = await db.tKhatm.findUnique({
		include: { parts: true },
		where: { id, accessToken: { equals: accessToken } },
	})

	return khatm
}
