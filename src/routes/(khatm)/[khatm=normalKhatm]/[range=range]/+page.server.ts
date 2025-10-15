import { QuranRange } from '$lib/entity/Range'
import { getAyahInfoRange } from '$service/quran'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
	const range = QuranRange.fromRangeParam(params.range)

	if (!range) throw error(400, { message: 'range is not valid' })

	const ayat = getAyahInfoRange(range, 'ansarian')
	const parentData = await parent()
	return { ayat, rangeParam: params.range, khatm: parentData.khatm }
}
