import type { ParamMatcher } from '@sveltejs/kit'

const regex = /^ks?\d+$/

export const match = ((param: string): param is `k${string}` => {
	return regex.test(param)
}) satisfies ParamMatcher
