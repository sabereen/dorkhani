import { QuranRange } from '$lib/entity/Range'
import { getAyahInfoRange } from '$service/quran'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const range = QuranRange.fromRangeParam(params.range)

	if (!range) throw error(400, { message: 'range is not valid' })

	if (range.getPageCount() > 50) {
		throw error(400, {
			message: `بازه‌های خیلی بزرگ قابل نمایش نیست. بازه‌ی شما: ${range.getTitle()}`,
		})
	}

	// @todo: ترجمه باید داینامیک شود
	const ayat = getAyahInfoRange(range, 'ansarian')

	return { ayat, rangeParam: params.range }
}
