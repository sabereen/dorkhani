import { createAuthClient } from 'better-auth/svelte'
import { authTokenStore } from '$lib/auth-token'
import { isCapacitorBuild, serverUrl } from '$lib/config/runtime'

export const authClient = createAuthClient({
	...(isCapacitorBuild ? { baseURL: serverUrl('/') } : {}),
	fetchOptions: {
		...(isCapacitorBuild
			? {
					auth: {
						type: 'Bearer' as const,
						token: () => authTokenStore.get() || '',
					},
				}
			: {}),
		onSuccess: async (context) => {
			const token = context.response.headers.get('set-auth-token')
			if (token) await authTokenStore.set(token)
		},
	},
})

export async function clearAuthToken() {
	await authTokenStore.clear()
}
