import { khatmService_claimGuestKhatms } from '$service/khatm'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, { message: 'ابتدا وارد حساب کاربری شوید.' })

	const body = await request.json()
	const claims = Array.isArray(body?.claims)
		? body.claims.filter(
				(claim: unknown): claim is { id: number; token: string } =>
					typeof claim === 'object' &&
					claim !== null &&
					Number.isSafeInteger((claim as { id?: unknown }).id) &&
					Number((claim as { id?: unknown }).id) > 0 &&
					typeof (claim as { token?: unknown }).token === 'string' &&
					/^[A-Za-z0-9_-]{43}$/.test(String((claim as { token?: unknown }).token)),
			)
		: []
	const claimedIds = await khatmService_claimGuestKhatms(locals.user.id, claims)
	return json({ claimedIds })
}
