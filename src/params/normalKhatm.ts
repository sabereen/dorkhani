import type { ParamMatcher } from '@sveltejs/kit'

export const match = ((param: string): param is `k${string}` => {
	return param.length > 1 && param[0] === 'k'
}) satisfies ParamMatcher
