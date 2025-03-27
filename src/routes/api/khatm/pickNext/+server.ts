import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import { importText } from '@ghoran/text'
import translation from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import type { Khatm } from '@prisma/client'

export type SelectedAyah = {
	index: number
	text: string
	translation: string
}

export type PickAyahResult = {
	khatm: Khatm
	ayat: SelectedAyah[]
}

export const POST: RequestHandler = async (event) => {
	const body: { khatmId: number; count: number } = await event.request.json()

	if (typeof body.khatmId !== 'number' || body.count < 0 || body.count > 40) {
		throw error(400, 'ورودی معتبر نیست')
	}

	const count = Math.floor(body.count)

	const result = await db.khatm.update({
		where: {
			id: body.khatmId,
			sequential: true,
			rangeType: 'ayah',
			currentAyahIndex: { lt: COUNT_OF_AYAHS - count + 1 },
		},
		data: {
			currentAyahIndex: { increment: count },
		},
	})

	const text = await importText('hafs')

	const ayat: SelectedAyah[] = []
	for (let i = count; i > 0; i--) {
		const ayahIndex = result.currentAyahIndex - i
		ayat.push({
			index: ayahIndex,
			text: text.default[ayahIndex],
			translation: translation[ayahIndex],
		})
	}

	return json({ khatm: result, ayat } satisfies PickAyahResult)
}
