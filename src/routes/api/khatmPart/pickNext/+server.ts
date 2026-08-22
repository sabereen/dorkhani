import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import type { PickAyahResult } from '$lib/contracts/api'
import { khatmPartService_pickNextAyat } from '$service/khatmPart'

import { type Translation, getAyahInfoRange } from '$service/quran'
import { userNotification_notify } from '$service/user-notification'
import { QuranRange } from '$lib/entity/Range'
import { formatNumber } from '$lib/i18n/format'
import * as m from '$lib/paraglide/messages.js'

type Body = {
	khatmId: number
	count: number
	accessToken?: string
	translation?: Translation
}

export const POST: RequestHandler = async (event) => {
	const body: Body = await event.request.json()

	if (typeof body.khatmId !== 'number' || body.count < 0 || body.count > 40) {
		throw error(400, { message: m.error_invalid_input(), code: 'invalid_input' })
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
			description: m.notification_ayah_range({
				count: formatNumber(result.count),
				from: range.startAyah.key,
				to: range.lastAyah.key,
			}),
			targetPath: `/${range.toRangeParam()}`,
		})
	}

	return json({ khatm: result.khatm, ayat } satisfies PickAyahResult)
}
