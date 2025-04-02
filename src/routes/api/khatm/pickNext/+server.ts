import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import translation from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import type { TKhatm } from '@prisma/client'

const { default: quranTextQPC1 } = await import('@ghoran/text/json/quran-text-qpc-v1.json')
const { default: quranTextQPC2 } = await import('@ghoran/text/json/quran-text-qpc-v2.json')
const { default: quranTextHafs } = await import('@ghoran/text/json/quran-text-hafs.json')

export type SelectedAyah = {
	index: number
	textQPC1: string
	textQPC2: string
	textHafs: string
	translation: string
}

export type PickAyahResult = {
	khatm: TKhatm
	ayat: SelectedAyah[]
}

export const POST: RequestHandler = async (event) => {
	const body: { khatmId: number; count: number; token?: string } = await event.request.json()

	if (typeof body.khatmId !== 'number' || body.count < 0 || body.count > 40) {
		throw error(400, 'ورودی معتبر نیست')
	}

	const count = Math.floor(body.count)

	const result = await db.tKhatm.update({
		where: {
			id: body.khatmId,
			accessToken: { equals: body.token || null },
			rangeType: 'ayah',
			currentAyahIndex: { lt: COUNT_OF_AYAHS - count + 1 },
		},
		data: {
			currentAyahIndex: { increment: count },
		},
	})

	const ayat: SelectedAyah[] = []
	for (let i = count; i > 0; i--) {
		const ayahIndex = result.currentAyahIndex - i
		ayat.push({
			index: ayahIndex,
			textQPC1: quranTextQPC1[ayahIndex],
			textQPC2: quranTextQPC2[ayahIndex],
			textHafs: quranTextHafs[ayahIndex],
			translation: translation[ayahIndex],
		})
	}

	return json({ khatm: result, ayat } satisfies PickAyahResult)
}
