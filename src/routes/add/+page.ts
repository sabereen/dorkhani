import type { PageLoad } from './$types'

export const load: PageLoad = ({ url }) => ({ rangeType: url.searchParams.get('rangeType') })
