import type { Locale } from '$lib/paraglide/runtime.js'
import type {
	AyahInfo,
	KhatmData,
	KhatmPartData,
	LandingStatistics,
	PublicBranding,
	ZekrRecord,
} from './domain'

export type PublicUser = {
	id: string
	name: string
	image: string | null
	locale: string
}

export type AppBootstrap = {
	locale: Locale
	needsLocaleChoice: boolean
	supportLink?: string | null
	branding: PublicBranding
	user: PublicUser | null
	authProviders: { google: boolean; eitaa: boolean; bale: boolean }
	miniAppUrls: { bale: string | null; eitaa: string | null }
}

export type HomeData = {
	khatms: KhatmData[]
	featuredKhatms: KhatmData[]
	showcase: KhatmData[]
	zekrList: ZekrRecord[]
	statistics: LandingStatistics
}

export type KhatmPageData = {
	khatm: KhatmData & { parts?: KhatmPartData[] }
	isAuthenticated: boolean
	isAdmin: boolean
	isOwner: boolean
	canEdit: boolean
	canStopSeries: boolean
	seriesMaxRounds: number | null
	featuredOrder: number | null
	canFeature: boolean
}

export type KhatmEditData = {
	khatm: KhatmData
	canChangeRange: boolean
	canDisableSeries: boolean
	isAdmin: boolean
}

export type NotificationChannel = 'bale' | 'eitaa' | 'email'
export type NotificationSettings = {
	enabled: boolean
	preferredChannel: NotificationChannel | null
	channels: Record<
		NotificationChannel,
		{ enabled: boolean; available: boolean; connected: boolean }
	>
} | null

export type AccountData = {
	user: { name: string; email: string | null }
	khatms: KhatmData[]
	notificationSettings: NotificationSettings
	messengerLinks: { bale: string | null; eitaa: string | null }
}

export type PickAyahResult = {
	khatm: KhatmData
	ayat: AyahInfo[]
}

export type CreateKhatmResult = {
	khatm?: KhatmData
	guestClaimToken?: string | null
	errorMessage?: string
	aiWarning?: { id: string; reason: string }
}
