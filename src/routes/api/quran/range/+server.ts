import { QuranRange } from '$lib/entity/Range'
import { getAyahInfoRange, type Translation } from '$service/quran'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = ({ url, cookies }) => {
	const rangeParam = url.searchParams.get('range') || ''
	const range = QuranRange.fromRangeParam(rangeParam)
	if (!range) error(400, { message: 'range is not valid' })
	if (range.getPageCount() > 50) {
		error(400, { message: `بازه‌های خیلی بزرگ قابل نمایش نیست. بازه‌ی شما: ${range.getTitle()}` })
	}
	const requestedTranslation = (url.searchParams.get('translation') || cookies.get('translation')) as Translation | null
	const translation: Translation =
		requestedTranslation === 'makarem' || requestedTranslation === 'gharaati'
			? requestedTranslation
			: 'ansarian'
	return json({ ayat: getAyahInfoRange(range, translation), rangeParam })
}
