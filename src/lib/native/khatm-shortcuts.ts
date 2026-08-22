import type { Khatm } from '$lib/entity/Khatm.svelte'
import { isCapacitorBuild } from '$lib/config/runtime'
import { Capacitor, registerPlugin } from '@capacitor/core'

type PinShortcutOptions = {
	id: string
	title: string
	url: string
}

type DisableShortcutOptions = {
	id: string
	message: string
}

interface KhatmShortcutsPlugin {
	isSupported(): Promise<{ supported: boolean }>
	pin(options: PinShortcutOptions): Promise<{ requested: boolean }>
	disable(options: DisableShortcutOptions): Promise<void>
}

const plugin = registerPlugin<KhatmShortcutsPlugin>('KhatmShortcuts')

export function isAndroidNativeApp() {
	return isCapacitorBuild && Capacitor.getPlatform() === 'android'
}

export function khatmShortcutIdFromRoute(route: string) {
	if (!/^(?:ks?|as?)\d+$/.test(route)) throw new Error('Invalid khatm shortcut route.')
	return `khatm:${route}`
}

export function khatmShortcutRoute(khatm: Khatm) {
	let prefix = khatm.isAyahOriented ? 'a' : 'k'
	if (khatm.isSerial) prefix += 's'
	return `${prefix}${khatm.isSerial ? khatm.seriesId : khatm.id}`
}

export async function isKhatmShortcutSupported() {
	if (!isAndroidNativeApp()) return false
	return (await plugin.isSupported()).supported
}

export async function pinKhatmShortcut(khatm: Khatm) {
	const route = khatmShortcutRoute(khatm)
	return plugin.pin({
		id: khatmShortcutIdFromRoute(route),
		title: khatm.title,
		url: khatm.publicLink,
	})
}

export async function disableKhatmShortcut(route: string) {
	if (!isAndroidNativeApp()) return
	await plugin.disable({
		id: khatmShortcutIdFromRoute(route),
		message: 'این ختم دیگر در دسترس نیست.',
	})
}
