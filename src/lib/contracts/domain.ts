export type RangeType = 'free' | 'juz' | 'hizbQuarter' | 'page' | 'surah' | 'ayah'
export type KhatmStatus = 'inProgress' | 'completed'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type AiReviewStatus = 'pending' | 'clear' | 'warning' | 'unavailable' | 'disabled'

export type KhatmPartData = {
	id: number
	khatmId: number
	start: number
	end: number
	created: Date | string
}

export type KhatmRecord = {
	id: number
	title: string
	description: string
	rangeType: RangeType
	versesRead: number
	pageProgress: number
	private: boolean
	accessToken: string | null
	created: Date | string
	endDate: Date | string | null
	status: KhatmStatus
	reviewStatus: ReviewStatus
	aiReviewStatus: AiReviewStatus
	aiReviewReason: string | null
	roundNumber: number
	seriesId: number | null
}

export type KhatmData = Omit<KhatmRecord, 'aiReviewStatus' | 'aiReviewReason'> & {
	aiReviewStatus?: AiReviewStatus
	aiReviewReason?: string | null
}

export type OfflineKhatmRound = {
	roundNumber: number
	created: Date
	completed: Date
}

export type OfflineKhatmRecord = {
	id: string
	title: string
	description: string
	rangeType: RangeType
	series: boolean
	seriesStopped: boolean
	roundNumber: number
	roundCreated: Date
	status: KhatmStatus
	versesRead: number
	pageProgress: number
	created: Date
	updated: Date
	endDate: Date | null
	completedRounds: OfflineKhatmRound[]
}

export type OfflineKhatmPartRecord = {
	id: string
	khatmId: string
	roundNumber: number
	start: number
	end: number
	created: Date
}

export type PublicBranding = {
	name: string
	tagline: string
	heroTitle: string
	heroHighlight: string
	heroDescription: string
	heroImageAlt: string
	seoTitle: string
	seoDescription: string
	revision: string
	heroImageUrl: string
	icon192Url: string
	icon512Url: string
}

export type ZekrRecord = {
	id: number
	title: string
	description: string
	zekrText: string | null
	count: number
	targetCount: number | null
	created: Date | string
}

export type AyahInfo = {
	index: number
	textQPC1: string
	textQPC2: string
	textHafs: string
	translation: string
}

export type LandingStatistics = {
	totals: { recitedAyahs: number; completedRounds: number }
	daily: Array<{
		date: string
		recitedAyahs: number
		createdKhatms: number
		completedRounds: number
	}>
}
