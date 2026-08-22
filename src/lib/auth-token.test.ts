import { describe, expect, it, vi } from 'vitest'
import { createBrowserAuthTokenStore } from './auth-token'

describe('AuthTokenStore browser adapter', () => {
	it('stores, reads, and clears the bearer token', () => {
		const values = new Map<string, string>()
		const storage = {
			getItem: vi.fn((key: string) => values.get(key) ?? null),
			setItem: vi.fn((key: string, value: string) => values.set(key, value)),
			removeItem: vi.fn((key: string) => values.delete(key)),
		}
		const store = createBrowserAuthTokenStore(storage)

		store.set('token-1')
		expect(store.get()).toBe('token-1')
		store.clear()
		expect(store.get()).toBeNull()
	})
})
