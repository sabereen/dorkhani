import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import { db } from '../db'

type CreatingKhatmPart = {
	khatmId: number
	accessToken: string | null
	start: number
	end: number
}
export async function khatmPartService_pickRange(body: CreatingKhatmPart) {
	const result = await db.tKhatm.update({
		where: {
			id: body.khatmId,
			accessToken: { equals: body.accessToken || null },
			parts: {
				every: {
					OR: [{ end: { lte: body.start } }, { start: { gte: body.end } }],
				},
			},
		},
		data: {
			currentAyahIndex: {
				increment: body.end - body.start,
			},
			parts: {
				create: {
					start: body.start,
					end: body.end,
					status: 'inprogress',
				},
			},
		},
	})

	return result
}

type PickNextAyatInput = {
	khatmId: number
	accessToken: string | null
	count: number
}
export async function khatmPartService_pickNextAyat(body: PickNextAyatInput) {
	const khatm = await db.tKhatm.update({
		where: {
			id: body.khatmId,
			accessToken: { equals: body.accessToken || null },
			rangeType: 'ayah',
			currentAyahIndex: { lt: COUNT_OF_AYAHS - body.count + 1 },
		},
		data: {
			currentAyahIndex: { increment: body.count },
		},
	})

	return khatm
}
