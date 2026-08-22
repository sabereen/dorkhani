import { describe, expect, it, vi } from 'vitest'
import { createBrowserAuthTokenStore, createNativeAuthTokenStore } from './auth-token'

function createStorage(values = new Map<string, string>()) {
	return {
		values,
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			values.set(key, value)
		}),
		removeItem: vi.fn((key: string) => {
			values.delete(key)
		}),
	}
}

describe('AuthTokenStore adapters', () => {
	it('stores, reads, and clears the browser bearer token', async () => {
		const storage = createStorage()
		const store = createBrowserAuthTokenStore(storage)

		await store.set('token-1')
		expect(store.get()).toBe('token-1')
		await store.clear()
		expect(store.get()).toBeNull()
	})

	it('hydrates the native bearer token before returning it synchronously', async () => {
		const secureStorage = createStorage(new Map([['app_v1_authToken', 'secure-token']]))
		const store = createNativeAuthTokenStore(async () => secureStorage)

		expect(store.get()).toBeNull()
		await store.ready()
		expect(store.get()).toBe('secure-token')
	})

	it('migrates a legacy localStorage token into secure storage once', async () => {
		const secureStorage = createStorage()
		const legacyStorage = createStorage(new Map([['app_v1_authToken', 'legacy-token']]))
		const store = createNativeAuthTokenStore(async () => secureStorage, legacyStorage)

		await store.ready()
		expect(store.get()).toBe('legacy-token')
		expect(secureStorage.setItem).toHaveBeenCalledWith('app_v1_authToken', 'legacy-token')
		expect(legacyStorage.removeItem).toHaveBeenCalledWith('app_v1_authToken')
	})

	it('clears the native token from memory and secure storage', async () => {
		const secureStorage = createStorage(new Map([['app_v1_authToken', 'secure-token']]))
		const store = createNativeAuthTokenStore(async () => secureStorage)
		await store.ready()

		await store.clear()
		expect(store.get()).toBeNull()
		expect(secureStorage.removeItem).toHaveBeenCalledWith('app_v1_authToken')
	})
})
