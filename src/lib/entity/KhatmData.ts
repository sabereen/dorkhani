import type { AiReviewStatus, TKhatm } from '@prisma-client'

export type KhatmData = Omit<
	TKhatm,
	'ownerId' | 'guestClaimTokenHash' | 'aiReviewStatus' | 'aiReviewReason'
> & {
	aiReviewStatus?: AiReviewStatus
	aiReviewReason?: string | null
}
