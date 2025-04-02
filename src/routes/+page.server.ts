import { db } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const khatms = await db.tKhatm.findMany({
		where: { private: false },
		orderBy: { id: 'desc' },
		take: 10,
	})

	return {
		khatms,
	}
}
