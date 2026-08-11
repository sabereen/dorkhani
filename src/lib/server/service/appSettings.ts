import { db } from '../db'

type Config = {
	/** لینک پشتیبانی سایت */
	readonly supportLink?: string
	/**
	 * تنظیمات مربوط به نوتیفیکیشن
	 */
	readonly notification: {
		eitaa?: boolean
		eitaaToken?: string
		eitaaChatId?: string
	}
}

type Store = { config: Config }

const store: Store = {
	config: {
		supportLink: '',
		notification: {
			eitaa: false,
		},
	},
}

export const appSettings_store = store

export async function appSettingsService_init() {
	await appSettingsService_update()
}

export async function appSettingsService_update() {
	const result = await db.tAppSettings.findUnique({ where: { id: 1 } })

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

	store.config = {
		supportLink: newConfig.supportLink,
		notification: {
			...store.config.notification,
			...newConfig.notification,
		},
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
