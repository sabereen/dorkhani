import { browser } from '$app/environment'
import { isEmptyObject } from '$lib/utility/isEmptyObject'
import { localStore } from '$lib/utility/localStore'
import { getContext, setContext } from 'svelte'

export type QuranFont = 'hafs' | 'qpc1' | 'qpc2'
export type Translation = 'ansarian' | 'makarem' | 'gharaati'
export type Reciter = 'minshawi' | 'parhizgar' | 'alafasi' | 'husari' | 'abdulbasit'

export interface ILocalSettings {
	quranFont: QuranFont
	translation: Translation
	reciter: Reciter
	readedRangesVisibility: 'visible' | 'invisible' | 'auto'
	externalQuranProvider: 'ketabmobin' | 'quran-com' | 'quran-projector'
}

export type SettingKey = keyof ILocalSettings

const defaultSettings = {
	quranFont: 'hafs',
	readedRangesVisibility: 'auto',
	reciter: 'minshawi',
	translation: 'ansarian',
	externalQuranProvider: 'quran-com',
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
		}
		this.storedConfig = finalConfig
	}

	updateByLocalStore() {
		if (!browser) return
		const storedSettings = localStore.getOrDefault(localStoreKey, {})
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
