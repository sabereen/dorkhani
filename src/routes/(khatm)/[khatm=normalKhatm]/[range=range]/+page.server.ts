import { QuranRange } from '$lib/entity/Range'
import { getAyahInfoRange, type Translation } from '$service/quran'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, cookies }) => {
	const range = QuranRange.fromRangeParam(params.range)

	if (!range) throw error(400, { message: 'range is not valid' })

	if (range.getPageCount() > 50) {
		throw error(400, {
			message: `بازه‌های خیلی بزرگ قابل نمایش نیست. بازه‌ی شما: ${range.getTitle()}`,
		})
	}

	const translation = cookies.get('translation') as Translation | null
	const ayat = getAyahInfoRange(range, translation || 'ansarian')

	return { ayat, rangeParam: params.range }
}
