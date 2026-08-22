import { browser } from '$app/environment'
import { isCapacitorBuild } from '$lib/config/runtime'
import { Capacitor } from '@capacitor/core'

export interface AuthTokenStore {
	ready(): Promise<void>
	get(): string | null
	set(token: string): Promise<void>
	clear(): Promise<void>
}

export type AsyncTokenStorage = {
	getItem(key: string): Promise<string | null> | string | null
	setItem(key: string, value: string): Promise<void> | void
	removeItem(key: string): Promise<void> | void
}

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const key = 'app_v1_authToken'

export function createBrowserAuthTokenStore(storage: BrowserStorage) {
	return {
		ready: async () => {},
		get: () => storage.getItem(key),
		set: async (token: string) => storage.setItem(key, token),
		clear: async () => storage.removeItem(key),
	} satisfies AuthTokenStore
}

export function createNativeAuthTokenStore(
	loadStorage: () => Promise<AsyncTokenStorage>,
	legacyStorage?: BrowserStorage,
) {
	let token: string | null = null
	let storage: AsyncTokenStorage | null = null
	let hydration: Promise<void> | null = null

	const ready = () => {
		hydration ??= (async () => {
			storage = await loadStorage()
			token = await storage.getItem(key)
			const legacyToken = legacyStorage?.getItem(key) ?? null
			if (!token && legacyToken) {
				await storage.setItem(key, legacyToken)
				token = legacyToken
			}
			if (legacyToken) legacyStorage?.removeItem(key)
		})()
		return hydration
	}

	return {
		ready,
		get: () => token,
		set: async (newToken: string) => {
			await ready()
			token = newToken
			await storage?.setItem(key, newToken)
		},
		clear: async () => {
			await ready()
			token = null
			await storage?.removeItem(key)
			legacyStorage?.removeItem(key)
		},
	} satisfies AuthTokenStore
}

const noopTokenStore: AuthTokenStore = {
	ready: async () => {},
	get: () => null,
	set: async () => {},
	clear: async () => {},
}

async function loadNativeSecureStorage(): Promise<AsyncTokenStorage> {
	const { SecureStorage } = await import('@aparajita/capacitor-secure-storage')
	await SecureStorage.setKeyPrefix('dorkhani_')
	return SecureStorage
}

export const authTokenStore =
	isCapacitorBuild && browser
		? Capacitor.getPlatform() === 'android'
			? createNativeAuthTokenStore(loadNativeSecureStorage, localStorage)
			: createBrowserAuthTokenStore(localStorage)
		: noopTokenStore
