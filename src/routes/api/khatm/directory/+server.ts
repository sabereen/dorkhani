import { khatmDirectory_parseSearchParams } from '$lib/entity/KhatmDirectory'
import { khatmService_getDirectoryList } from '$service/khatm'
import { json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url }) => {
	return json(await khatmService_getDirectoryList(khatmDirectory_parseSearchParams(url.searchParams)))
}
