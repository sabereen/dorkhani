import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import { db } from '../db'
import { error } from '@sveltejs/kit'
import { QuranRange } from '$lib/entity/Range'
import { Prisma } from '@prisma-client'
import { khatmService_setAsCompleted, khatmService_toPublic } from './khatm'
import {
	statisticsService_applyCommitted,
	statisticsService_increment,
} from './statistics'

type CreatingKhatmPart = {
	khatmId: number
	accessToken: string | null
	start: number
	end: number
}
export async function khatmPartService_pickRange(body: CreatingKhatmPart) {
	const khatm = await db.tKhatm.findUnique({
		where: { id: body.khatmId, accessToken: { equals: body.accessToken || null } },
	})

	if (!khatm) {
		throw error(404, { message: 'ختم وجود ندارد.' })
	}

	if (khatm.rangeType === 'ayah') {
		throw error(400, 'در ختم آیه به آیه امکان انتخاب بازه دلخواه وجود ندارد.')
	}

	if (khatm.rangeType !== 'free') {
		const range = new QuranRange(body.start, body.end)
		if (!range.matchRangeType(khatm.rangeType)) {
			throw error(400, { message: 'بازه انتخابی با نوع ختم تطابق ندارد.' })
		}
	}

	try {
		const pickedAt = new Date()
		const result = await db.$transaction(async (tx) => {
			const updated = await tx.tKhatm.update({
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
					versesRead: {
						increment: body.end - body.start,
					},
					parts: {
						create: {
							start: body.start,
							end: body.end,
						},
					},
				},
			})

			const verseCount = body.end - body.start
			if (verseCount > 0) {
				await tx.tKhatmRecitation.create({
					data: { khatmId: body.khatmId, verseCount, created: pickedAt },
				})
				await statisticsService_increment(tx, { recitedAyahs: verseCount }, pickedAt)
			}

			return updated
		})
		if (body.end > body.start) {
			statisticsService_applyCommitted({ recitedAyahs: body.end - body.start }, pickedAt)
		}

		if (result.versesRead >= COUNT_OF_AYAHS) {
			await khatmService_setAsCompleted(result.id)
		}

		return khatmService_toPublic(result)
	} catch (err) {
		const prismaKnownError = err as Prisma.PrismaClientKnownRequestError
		if (prismaKnownError?.name === 'PrismaClientKnownRequestError') {
			if (prismaKnownError.code === 'P2025' && prismaKnownError.meta?.modelName === 'TKhatm') {
				throw error(409, {
					type: 'conflict-ranges',
					message: 'متأسفانه دیگران همزمان با شما بازه‌ای متداخل با این بازه انتخاب کرده اند.',
				})
			}
		}
		throw err
	}
}

type PickNextAyatInput = {
	khatmId: number
	accessToken: string | null
	count: number
}
export async function khatmPartService_pickNextAyat(body: PickNextAyatInput) {
	const khatm = await db.tKhatm.findUnique({
		where: {
			id: body.khatmId,
			accessToken: { equals: body.accessToken || null },
			rangeType: 'ayah',
		},
	})

	if (!khatm) {
		throw error(404, { message: 'ختم مورد نظر وجود ندارد' })
	}

	if (khatm.versesRead === COUNT_OF_AYAHS) {
		throw error(400, { message: 'این ختم به پایان رسیده است.' })
	}

	const count = Math.min(body.count, COUNT_OF_AYAHS - khatm.versesRead)
	const pickedAt = new Date()

	const updated = await db.$transaction(async (tx) => {
		const result = await tx.tKhatm.update({
			where: {
				id: body.khatmId,
				versesRead: { lt: COUNT_OF_AYAHS - count + 1 },
			},
			data: {
				versesRead: { increment: count },
			},
		})

		if (count > 0) {
			await tx.tKhatmRecitation.create({
				data: { khatmId: body.khatmId, verseCount: count, created: pickedAt },
			})
			await statisticsService_increment(tx, { recitedAyahs: count }, pickedAt)
		}

		return result
	})
	if (count > 0) statisticsService_applyCommitted({ recitedAyahs: count }, pickedAt)

	if (updated.versesRead >= COUNT_OF_AYAHS) {
		await khatmService_setAsCompleted(updated.id)
	}

	return {
		khatm: khatmService_toPublic(updated),
		count,
	}
}
