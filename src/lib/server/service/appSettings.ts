import { db } from '../db'
import {
	DEFAULT_BRANDING_CONFIG,
	normalizeBrandingConfig,
	type BrandingConfig,
} from '$lib/entity/Branding'

export const DEFAULT_STALE_KHATM_RETENTION_DAYS = 30
export const MIN_STALE_KHATM_RETENTION_DAYS = 1
export const MAX_STALE_KHATM_RETENTION_DAYS = 3650

export type AiKhatmReviewConfig = {
	enabled: boolean
	baseUrl?: string
	model?: string
	apiKey?: string
}

export type Config = {
	/** لینک پشتیبانی سایت */
	readonly supportLink?: string
	readonly staleKhatmRetentionDays: number
	/**
	 * تنظیمات مربوط به نوتیفیکیشن
	 */
	readonly notification: {
		eitaa?: boolean
		eitaaToken?: string
		eitaaChatId?: string
	}
	readonly aiKhatmReview: AiKhatmReviewConfig
	readonly branding: BrandingConfig
}

export type BrandingAssets = {
	hero?: { data: Uint8Array; mimeType: 'image/png' | 'image/jpeg' }
	icon192?: Uint8Array
	icon512?: Uint8Array
}

type Store = { config: Config }

const store: Store = {
	config: {
		supportLink: '',
		staleKhatmRetentionDays: DEFAULT_STALE_KHATM_RETENTION_DAYS,
		notification: {
			eitaa: false,
		},
		aiKhatmReview: {
			enabled: false,
			baseUrl: '',
			model: '',
		},
		branding: DEFAULT_BRANDING_CONFIG,
	},
}

export const appSettings_store = store

export async function appSettingsService_init() {
	await appSettingsService_update()
}

export async function appSettingsService_update() {
	const result = await db.tAppSettings.findUnique({
		where: { id: 1 },
		select: { config: true },
	})

	if (!result) {
		await db.tAppSettings.create({
			data: {
				id: 1,
				config: store.config,
			},
		})
	}

	await apply(result?.config as unknown as Config)
}

async function apply(newConfig?: Config | null) {
	if (!newConfig) return

	const staleKhatmRetentionDays = Number(newConfig.staleKhatmRetentionDays)
	store.config = {
		supportLink: newConfig.supportLink,
		staleKhatmRetentionDays:
			Number.isInteger(staleKhatmRetentionDays) &&
			staleKhatmRetentionDays >= MIN_STALE_KHATM_RETENTION_DAYS &&
			staleKhatmRetentionDays <= MAX_STALE_KHATM_RETENTION_DAYS
				? staleKhatmRetentionDays
				: DEFAULT_STALE_KHATM_RETENTION_DAYS,
		notification: {
			...store.config.notification,
			...newConfig.notification,
		},
		aiKhatmReview: {
			...store.config.aiKhatmReview,
			...newConfig.aiKhatmReview,
			enabled: newConfig.aiKhatmReview?.enabled === true,
		},
		branding: normalizeBrandingConfig(newConfig.branding),
	}
}

export async function appSettingsService_setKey<T extends keyof Config>(key: T, value: Config[T]) {
	const newConfig = {
		...store.config,
	}
	newConfig[key] = value
	await db.tAppSettings.update({
		where: { id: 1 },
		data: { config: newConfig },
	})
	store.config = newConfig
}

export async function appSettingsService_setConfig(
	newConfig: Config,
	assets: BrandingAssets = {},
) {
	await db.tAppSettings.update({
		where: { id: 1 },
		data: {
			config: newConfig,
			...(assets.hero
				? { heroImage: assets.hero.data, heroImageMime: assets.hero.mimeType }
				: {}),
			...(assets.icon192 ? { appIcon192: assets.icon192 } : {}),
			...(assets.icon512 ? { appIcon512: assets.icon512 } : {}),
		},
	})
	store.config = newConfig
}
