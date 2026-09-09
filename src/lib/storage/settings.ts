import { browser } from '$app/environment'
import { isCapacitorBuild } from '$lib/config/runtime'
import { nativePreferences } from '$lib/native/preferences'
import { Capacitor } from '@capacitor/core'

const prefix = 'app_v1_'
const values = new Map<string, unknown>()
let initialization: Promise<void> | undefined

function isAndroidNative() {
	return browser && isCapacitorBuild && Capacitor.getPlatform() === 'android'
}

function parse(value: string | null) {
	if (value == null) return null
	try {
		return JSON.parse(value) as unknown
	} catch {
		return null
	}
}

export const settingsStore = {
	prepareKey(key: string) {
		return `${prefix}${key}`
	},

	ready() {
		initialization ??= (async () => {
			if (!browser) return
			const key = this.prepareKey('localSettings')
			const raw = isAndroidNative()
				? (await nativePreferences.get({ key })).value
				: localStorage.getItem(key)
			const parsed = parse(raw)
			if (parsed != null) values.set('localSettings', parsed)
		})()
		return initialization
	},

	get<T>(key: string): T | null {
		return (values.get(key) as T | undefined) ?? null
	},

	getOrDefault<T>(key: string, defaultValue: T): T {
		return (values.get(key) as T | undefined) ?? defaultValue
	},

	async set(key: string, value: unknown) {
		values.set(key, value)
		if (!browser) return
		const storageKey = this.prepareKey(key)
		const serialized = JSON.stringify(value)
		if (isAndroidNative()) await nativePreferences.set({ key: storageKey, value: serialized })
		else localStorage.setItem(storageKey, serialized)
	},

	async remove(key: string) {
		values.delete(key)
		if (!browser) return
		const storageKey = this.prepareKey(key)
		if (isAndroidNative()) await nativePreferences.remove({ key: storageKey })
		else localStorage.removeItem(storageKey)
	},

	reloadFromBrowser(key: string) {
		if (!browser || isAndroidNative()) return
		const parsed = parse(localStorage.getItem(this.prepareKey(key)))
		if (parsed == null) values.delete(key)
		else values.set(key, parsed)
	},
}
