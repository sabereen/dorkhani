import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import { importText } from '@ghoran/text'
import translation from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import type { Khatm } from '@prisma/client'

export type PickAyahResult = {
	khatm: Khatm
	ayahIndex: number
	ayahText: string
	ayahTranslation: string
}

export const POST: RequestHandler = async (event) => {
	const body: { khatmId: number } = await event.request.json()

	if (typeof body.khatmId !== 'number') {
		throw error(400, 'ورودی معتبر نیست')
	}

	const result = await db.khatm.update({
		where: {
			id: body.khatmId,
			sequential: true,
			rangeType: 'ayah',
			currentAyahIndex: { lt: COUNT_OF_AYAHS },
		},
		data: {
			currentAyahIndex: { increment: 1 },
		},
	})

	const text = await importText('hafs')

	return json({
		khatm: result,
		ayahIndex: result.currentAyahIndex,
		ayahText: text.default[result.currentAyahIndex],
		ayahTranslation: translation[result.currentAyahIndex],
	} satisfies PickAyahResult)
}
