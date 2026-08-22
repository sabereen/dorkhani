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
		onSuccess: (context) => {
			const token = context.response.headers.get('set-auth-token')
			if (token) authTokenStore.set(token)
		},
	},
})

export function clearAuthToken() {
	authTokenStore.clear()
}
