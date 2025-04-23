import { appSettingsService_setShowcase } from '$service/appSettings'
import { auth_ensureIsAdmin } from '$service/auth'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async (event) => {
	auth_ensureIsAdmin(event)

	const body: { showcase: number[] } = await event.request.json()

	if (!Array.isArray(body.showcase) || body.showcase.some((id) => typeof id !== 'number')) {
		throw error(400, { message: 'ورودی معتبر نیست' })
	}

	await appSettingsService_setShowcase(body.showcase)

	return json({})
}
