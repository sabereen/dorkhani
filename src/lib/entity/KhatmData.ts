import type { TKhatm } from '@prisma-client'

export type KhatmData = Omit<TKhatm, 'ownerId' | 'guestClaimTokenHash'>
