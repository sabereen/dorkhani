import {
	idb_createdKhatm_clearClaimTokens,
	idb_createdKhatm_getClaims,
} from '$lib/idb/createdKhatm'
import { apiRequest } from '$lib/utility/request'

export async function claimCreatedKhatms() {
	const claims = await idb_createdKhatm_getClaims()
	if (claims.length === 0) return 0

	const result = await apiRequest<{ claimedIds: number[] }>('POST', '/khatm/claim', {
		body: { claims },
		origin: location.origin,
	}).catch(() => null)
	if (!result) return 0
	await idb_createdKhatm_clearClaimTokens(result.claimedIds)
	return result.claimedIds.length
}
