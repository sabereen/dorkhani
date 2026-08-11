import { browser } from '$app/environment'
import { isEmptyObject } from '$lib/utility/isEmptyObject'
import { localStore } from '$lib/utility/localStore'
import { setCookie } from '$lib/utility/setCookie'
import { getContext, setContext } from 'svelte'
import type { ColorScheme } from './Theme'

export type QuranFont = 'hafs' | 'qpc1' | 'qpc2'
export type Translation = 'ansarian' | 'makarem' | 'gharaati'
export type Reciter = 'minshawi' | 'parhizgar' | 'husari' | 'abdulbasit'

export interface ILocalSettings {
	quranFont: QuranFont
	translation: Translation
	reciter: Reciter
	readedRangesVisibility: 'visible' | 'invisible' | 'auto'
	externalQuranProvider: 'ketabmobin' | 'quran-com' | 'quran-projector'
	colorScheme: ColorScheme
}

export type SettingKey = keyof ILocalSettings

const defaultSettings = {
	quranFont: 'hafs',
	readedRangesVisibility: 'auto',
	reciter: 'minshawi',
	translation: 'ansarian',
	externalQuranProvider: 'quran-com',
	colorScheme: 'system',
} as const satisfies ILocalSettings

const localStoreKey = 'localSettings'

export class LocalSettings {
	private static readonly contextKey = Symbol('localSettings')

	static provide() {
		const localSettings = new LocalSettings()
		localSettings.init()
		setContext(this.contextKey, localSettings)
	}

	static use() {
		return getContext<LocalSettings>(this.contextKey)
	}

	private storedConfig: Partial<ILocalSettings> = $state({})
	public config: Readonly<ILocalSettings> = $derived({ ...defaultSettings, ...this.storedConfig })

	update(config: Partial<ILocalSettings>, { bypassLocalStore = false } = {}) {
		const finalConfig = {
			...this.storedConfig,
			...config,
		}
		if (!bypassLocalStore) {
			localStore.set(localStoreKey, finalConfig)
			this.updateCookies(config)
		}
		this.storedConfig = finalConfig
	}

	/**
	 * کانفیگ تغییریافته را می‌گیرد
	 * و اگر شامل فیلدهایی بود که سمت سرور به آن‌ها نیاز داریم
	 * فیلدهای مربوطه را در کوکی مرورگر نیز ذخیره می‌کند
	 * @param config
	 */
	private updateCookies(config: Partial<ILocalSettings>) {
		const ONE_YEAR = 365 * 24 * 3600
		if (config.colorScheme != null) {
			if (config.colorScheme === 'system') {
				setCookie('colorScheme', '', 0)
			} else {
				setCookie('colorScheme', config.colorScheme, ONE_YEAR)
			}
		}
		if (config.translation != null) {
			setCookie('translation', config.translation, ONE_YEAR)
		}
	}

	updateByLocalStore() {
		if (!browser) return
		const storedSettings = normalizeSettings(localStore.getOrDefault(localStoreKey, {}))
		this.update(storedSettings, { bypassLocalStore: true })
	}

	edit() {
		const editor = new SettingsEditor(this)
		return editor
	}

	private init() {
		if (!browser) return
		this.updateByLocalStore()
		window.addEventListener('storage', (event) => {
			if (event.key === localStore.prepareKey(localStoreKey)) {
				this.updateByLocalStore()
			}
		})
	}
}

export function normalizeSettings(value: unknown): Partial<ILocalSettings> {
	if (!value || typeof value !== 'object') return {}
	const stored = value as Record<string, unknown>
	const result: Partial<ILocalSettings> = {}

	if (stored.quranFont === 'hafs' || stored.quranFont === 'qpc1' || stored.quranFont === 'qpc2') {
		result.quranFont = stored.quranFont
	}
	if (
		stored.translation === 'ansarian' ||
		stored.translation === 'makarem' ||
		stored.translation === 'gharaati'
	) {
		result.translation = stored.translation
	}
	if (
		stored.reciter === 'minshawi' ||
		stored.reciter === 'parhizgar' ||
		stored.reciter === 'husari' ||
		stored.reciter === 'abdulbasit'
	) {
		result.reciter = stored.reciter
	}
	if (
		stored.readedRangesVisibility === 'visible' ||
		stored.readedRangesVisibility === 'invisible' ||
		stored.readedRangesVisibility === 'auto'
	) {
		result.readedRangesVisibility = stored.readedRangesVisibility
	}
	if (
		stored.externalQuranProvider === 'ketabmobin' ||
		stored.externalQuranProvider === 'quran-com' ||
		stored.externalQuranProvider === 'quran-projector'
	) {
		result.externalQuranProvider = stored.externalQuranProvider
	}
	if (
		stored.colorScheme === 'system' ||
		stored.colorScheme === 'light' ||
		stored.colorScheme === 'dark'
	) {
		result.colorScheme = stored.colorScheme
	}
	return result
}

export class SettingsEditor {
	private localSettings: LocalSettings

	/** بدون نیاز به فراخوانی صریح کامیت تغییرات در استوریج ذخیره شود؟ */
	live = false

	/**
	 * یک پروکسی برای مشاهده‌ی تنظیمات
	 * هر زمان مقدارش ست می‌شود در یک آبجکت موقتی نگهداری می‌شود
	 * با فراخوانی متد کامیت تغییرات در استوریج ذخیره می‌شود
	 */
	config: ILocalSettings

	/**
	 * یک آبجکت موقتی برای ذخیره تغییرات
	 * برای اینکه فقط تغییرات ذخیره شود (نه کل تنظیمات)
	 */
	private tempConfig: Partial<ILocalSettings> = $state({})

	dirty = $derived(!isEmptyObject(this.tempConfig))

	static use() {
		const localSettings = LocalSettings.use()
		return localSettings.edit()
	}

	constructor(localSettings: LocalSettings) {
		this.localSettings = localSettings

		this.config = new Proxy(localSettings.config, {
			set: (_target, p: SettingKey, newValue) => {
				this.tempConfig[p] = newValue
				if (this.live) this.commit()
				return true
			},
			get: (_target, p: SettingKey) => {
				if (p in this.tempConfig) {
					return this.tempConfig[p]
				}
				return this.localSettings.config[p]
			},
			deleteProperty: (_target, p: SettingKey) => {
				this.tempConfig[p] = undefined
				return true
			},
		})
	}

	commit() {
		this.localSettings.update($state.snapshot(this.tempConfig))
		this.tempConfig = {}
	}

	cancel() {
		this.tempConfig = {}
	}
}
