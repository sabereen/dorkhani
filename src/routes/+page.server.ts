import { db } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const khatms = await db.khatm.findMany({
		orderBy: { id: 'desc' },
		take: 10,
	})

	return {
		khatms,
	}
}
