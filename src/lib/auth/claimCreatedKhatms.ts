import { clientStorage } from '$lib/storage/client'
import { apiRequest } from '$lib/utility/request'

export async function claimCreatedKhatms() {
	const claims = await clientStorage.createdKhatms.getClaims()
	if (claims.length === 0) return 0

	const result = await apiRequest<{ claimedIds: number[] }>('POST', '/khatm/claim', {
		body: { claims },
		origin: location.origin,
	}).catch(() => null)
	if (!result) return 0
	await clientStorage.createdKhatms.clearClaimTokens(result.claimedIds)
	return result.claimedIds.length
}
