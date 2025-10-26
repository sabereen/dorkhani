import type { ParamMatcher } from '@sveltejs/kit'

const regex = /^as?\d+$/

export const match = ((param: string): param is `a${string}` => {
	return regex.test(param)
}) satisfies ParamMatcher
