import { browser } from '$app/environment'
import { isCapacitorBuild } from '$lib/config/runtime'

export interface AuthTokenStore {
	get(): string | null
	set(token: string): void
	clear(): void
}

const key = 'app_v1_authToken'

export function createBrowserAuthTokenStore(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
	return {
		get: () => storage.getItem(key),
		set: (token: string) => storage.setItem(key, token),
		clear: () => storage.removeItem(key),
	} satisfies AuthTokenStore
}

const noopTokenStore: AuthTokenStore = {
	get: () => null,
	set: () => {},
	clear: () => {},
}

export const authTokenStore =
	isCapacitorBuild && browser ? createBrowserAuthTokenStore(localStorage) : noopTokenStore
