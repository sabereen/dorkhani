import type { MiniAppHostName } from './links'

export function hasEitaaInitData(initData: string | undefined) {
	if (!initData) return false
	const params = new URLSearchParams(initData)
	return params.has('device_id') && params.has('auth_date') && params.has('hash')
}

export function hasSoroushInitData(initData: string | undefined) {
	if (!initData) return false
	const params = new URLSearchParams(initData)
	return params.has('auth_date') && params.has('hash') && params.has('splus_query_id')
}

export function hasBaleInitData(initData: string | undefined) {
	if (!initData) return false
	const params = new URLSearchParams(initData)
	return params.has('auth_date') && params.has('hash') && !params.has('device_id') && !params.has('splus_query_id')
}

export function detectMiniAppHost(input: {
	soroush?: string
	eitaa?: string
	bale?: string
	launch?: string
}): MiniAppHostName | null {
	if (hasSoroushInitData(input.soroush) || hasSoroushInitData(input.launch)) return 'soroush'
	if (hasEitaaInitData(input.eitaa) || hasEitaaInitData(input.launch)) return 'eitaa'
	if (hasBaleInitData(input.bale) || hasBaleInitData(input.launch)) return 'bale'
	return null
}
