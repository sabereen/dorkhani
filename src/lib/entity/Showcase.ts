import { request } from '$lib/utility/request'

export async function showcase_save(body: { showcase: number[]; autoShowcase: boolean }) {
	await request('post', '/showcase', body)
}
