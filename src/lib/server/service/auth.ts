import { error, type RequestEvent } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'

const userName = env.ADMIN_USER || Math.random().toString()
const password = env.ADMIN_PASS || Math.random().toString()
const correctAuthorization = `Basic ${btoa(`${userName}:${password}`)}`

export function auth_checkIsAdmin({ request }: RequestEvent) {
	const authorization = request.headers.get('authorization')
	return authorization === correctAuthorization
}

export function auth_ensureIsAdmin(event: RequestEvent) {
	if (!auth_checkIsAdmin(event)) {
		event.setHeaders({
			'WWW-Authenticate': 'Basic realm="Admin"',
		})
		throw error(401, { message: 'لطفا به حساب کاربری خود وارد شوید.' })
	}
}
