import { QuranRange } from '$lib/entity/Range'
import { getAyahInfoRange } from '$service/quran'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ params }) => {
	const range = QuranRange.fromRangeParam(params.range)

	if (!range) throw error(400, { message: 'range is not valid' })

	const ayat = getAyahInfoRange(range, 'ansarian')
	return { ayat, rangeParam: params.range }
}
