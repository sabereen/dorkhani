import { zekrService_get } from '$service/zekr'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id)
	if (!Number.isSafeInteger(id)) error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	const zekr = await zekrService_get(id)
	if (!zekr) error(404, { message: 'ختم مورد نظر پیدا نشد.' })
	return json({ zekr })
}
