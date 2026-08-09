import {
	idb_createdKhatm_clearClaimTokens,
	idb_createdKhatm_getClaims,
} from '$lib/idb/createdKhatm'
import { base } from '$app/paths'

export async function claimCreatedKhatms() {
	const claims = await idb_createdKhatm_getClaims()
	if (claims.length === 0) return 0

	const response = await fetch(`${base}/api/khatm/claim`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ claims }),
	})
	if (!response.ok) return 0

	const result: { claimedIds: number[] } = await response.json()
	await idb_createdKhatm_clearClaimTokens(result.claimedIds)
	return result.claimedIds.length
}
