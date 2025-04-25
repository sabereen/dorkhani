import type { TKhatm } from '@prisma/client'

export interface AdminNotification {
	send(text: string): Promise<void>
	sendNewKhatm(khatm: TKhatm, origin: string): Promise<void>
}
