import { db } from '$lib/server/db'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import translation from '@ghoran/translation/json/fa/tanzil-ansarian.json'
import quranTextQPC1 from '@ghoran/text/json/quran-text-qpc-v1.json'
import type { Khatm } from '@prisma/client'
import { verifyPrivateKhatm } from '$lib/server/security'

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
	const body: { khatmId: number; count: number; token?: string } = await event.request.json()

	if (typeof body.khatmId !== 'number' || body.count < 0 || body.count > 40) {
		throw error(400, 'ورودی معتبر نیست')
	}

	const count = Math.floor(body.count)

	/** آیا اگر ختم خصوصی بود باز هم آپدیت شود؟ */
	let privateAllowed = false

	// اگر توکن داشت تلاش می‌کنیم اعتبارسنجی کنیم
	// وگرنه نیازی به این کار نیست و شرط privateAllowed در کوئری جلوی درخواست بدون توکن به ختم خصوصی را می‌گیرد.
	if (body.token) {
		const khatm = await db.khatm.findUnique({ where: { id: body.khatmId } })
		if (!khatm) throw error(404, { message: 'ختم وجود ندارد.' })
		if (khatm?.private) {
			privateAllowed = await verifyPrivateKhatm(khatm, body.token)
			if (!privateAllowed) throw error(403, 'شما اجازه دسترسی به این ختم را ندارید.')
		}
	}

	const result = await db.khatm.update({
		where: {
			id: body.khatmId,
			sequential: true,
			rangeType: 'ayah',
			private: privateAllowed,
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
			text: quranTextQPC1[ayahIndex],
			translation: translation[ayahIndex],
		})
	}

	return json({ khatm: result, ayat } satisfies PickAyahResult)
}
