import { khatmService_getOwnedList } from '$service/khatm'
import { base } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, `${base}/auth/login`)
	return {
		user: {
			name: locals.user.name,
			email: locals.user.email.endsWith('@users.invalid') ? null : locals.user.email,
		},
		khatms: await khatmService_getOwnedList(locals.user.id),
	}
}
