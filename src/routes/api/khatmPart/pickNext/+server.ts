import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { TKhatm } from '@prisma/client'
import { khatmPartService_pickNextAyat } from '$service/khatmPart'

import translationAnsarian from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import translationMakarem from '@ghoran/translation/json/fa/tanzil-makarem.json'
import translationGharaati from '@ghoran/translation/json/fa/tanzil-gharaati.json'

import quranTextQPC1 from '@ghoran/text/json/quran-text-qpc-v1.json'
import quranTextQPC2 from '@ghoran/text/json/quran-text-qpc-v2.json'
import quranTextHafs from '@ghoran/text/json/quran-text-hafs.json'

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

const translationMap = {
	ansarian: translationAnsarian,
	makarem: translationMakarem,
	gharaati: translationGharaati,
}

type Body = {
	khatmId: number
	count: number
	accessToken?: string
	translation?: keyof typeof translationMap
}

export const POST: RequestHandler = async (event) => {
	const body: Body = await event.request.json()

	if (typeof body.khatmId !== 'number' || body.count < 0 || body.count > 40) {
		throw error(400, 'ورودی معتبر نیست')
	}

	const count = Math.floor(body.count)

	const result = await khatmPartService_pickNextAyat({
		khatmId: body.khatmId,
		accessToken: body.accessToken || null,
		count,
	})

	const ayat: SelectedAyah[] = []
	for (let i = result.count; i > 0; i--) {
		const ayahIndex = result.khatm.versesRead - i
		const translation = translationMap[body.translation!] || translationAnsarian
		ayat.push({
			index: ayahIndex,
			textQPC1: quranTextQPC1[ayahIndex],
			textQPC2: quranTextQPC2[ayahIndex],
			textHafs: quranTextHafs[ayahIndex],
			translation: translation[ayahIndex],
		})
	}

	return json({ khatm: result.khatm, ayat } satisfies PickAyahResult)
}
