import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { KhatmData } from '$lib/entity/KhatmData'
import { khatmPartService_pickNextAyat } from '$service/khatmPart'

import { type Translation, type AyahInfo, getAyahInfoRange } from '$service/quran'
import { userNotification_notify } from '$service/user-notification'
import { QuranRange } from '$lib/entity/Range'

export type PickAyahResult = {
	khatm: KhatmData
	ayat: AyahInfo[]
}

type Body = {
	khatmId: number
	count: number
	accessToken?: string
	translation?: Translation
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

	const ayat = getAyahInfoRange(
		{
			start: result.khatm.versesRead - result.count,
			end: result.khatm.versesRead,
		},
		body.translation!,
	)
	if (result.count > 0) {
		const range = new QuranRange(result.khatm.versesRead - result.count, result.khatm.versesRead)
		userNotification_notify(event.locals.user?.id, {
			type: 'participationPicked',
			title: result.khatm.title,
			description: `${result.count.toLocaleString('fa-IR')} آیه، از ${range.startAyah.key} تا ${range.lastAyah.key}`,
			targetPath: `/${range.toRangeParam()}`,
		})
	}

	return json({ khatm: result.khatm, ayat } satisfies PickAyahResult)
}
