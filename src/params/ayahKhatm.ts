import type { ParamMatcher } from '@sveltejs/kit'

const regex = /^a\d+$/

export const match = ((param: string): param is `a${string}` => {
	return regex.test(param)
}) satisfies ParamMatcher
