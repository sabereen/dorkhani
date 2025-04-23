import type { LayoutServerLoad } from './$types'
import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'

const userName = env.ADMIN_USER || Math.random().toString()
const password = env.ADMIN_PASS || Math.random().toString()
const correctAuthorization = `Basic ${btoa(`${userName}:${password}`)}`

export const load: LayoutServerLoad = async ({ request, setHeaders }) => {
	const authorization = request.headers.get('authorization')
	if (authorization !== correctAuthorization) {
		setHeaders({
			'WWW-Authenticate': 'Basic realm="Admin"',
		})
		throw error(401, { message: 'لطفا به حساب کاربری خود وارد شوید.' })
	}
}
