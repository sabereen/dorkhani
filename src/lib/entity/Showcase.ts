import { request } from '$lib/utility/request'

export async function showcase_save(body: { showcase: number[] }) {
	await request('post', '/showcase', body)
}
