import { isLocale } from '$lib/i18n/locale'
import { db } from '$lib/server/db'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json().catch(() => null)
	if (!isLocale(body?.locale)) return json({ code: 'invalid_locale' }, { status: 400 })
	if (locals.user) {
		await db.user.update({ where: { id: locals.user.id }, data: { locale: body.locale } })
		locals.user.locale = body.locale
	}
	return new Response(null, { status: 204 })
}

