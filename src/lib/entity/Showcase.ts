import { request } from '$lib/utility/request'

export async function showcase_save(showcase: number[]) {
	await request('post', '/showcase', { showcase })
}
