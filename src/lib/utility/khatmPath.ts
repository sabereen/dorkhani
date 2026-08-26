import type { KhatmData } from '$lib/contracts/domain'

export type KhatmLayout = 'wizard' | 'grid' | 'list'

export function getKhatmPath(
	khatm: Pick<KhatmData, 'id' | 'rangeType' | 'seriesId' | 'accessToken'>,
	layout: KhatmLayout = 'wizard',
) {
	let prefix = khatm.rangeType === 'ayah' ? 'a' : 'k'
	if (khatm.seriesId != null) prefix += 's'
	const id = khatm.seriesId ?? khatm.id
	const layoutPart = layout === 'wizard' ? '' : `/${layout}`
	return `/${prefix}${id}${layoutPart}${khatm.accessToken ? `?t=${khatm.accessToken}` : ''}`
}
