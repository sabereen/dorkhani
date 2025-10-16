import { QuranRange } from '$lib/entity/Range'
import type { ParamMatcher } from '@sveltejs/kit'

export const match = ((param: string): param is `${number}:${number}-${number}:${number}` => {
	return !!QuranRange.fromRangeParam(param)
}) satisfies ParamMatcher
