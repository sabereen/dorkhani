import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { verifyPrivateKhatm } from '$lib/server/security'

export const load: PageServerLoad = async ({ params, url }) => {
	const khatmId = +params.khatmId

	const khatm = await db.khatm.findUnique({
		include: { parts: true },
		where: { id: khatmId },
	})

	if (!khatm) {
		throw error(400, { message: 'ختم مورد نظر پیدا نشد.' })
	}

	if (khatm.private) {
		const hash = url.searchParams.get('token')
		const isOK = !!hash && (await verifyPrivateKhatm(khatm, hash))
		if (!isOK) throw error(403, { message: 'شما به این ختم دسترسی ندارید.' })
	}

	return {
		khatm,
	}
}
