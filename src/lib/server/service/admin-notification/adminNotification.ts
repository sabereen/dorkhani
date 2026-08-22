import type { KhatmData } from '$lib/contracts/domain'

export interface AdminNotification {
	send(text: string): Promise<void>
	sendNewKhatm(khatm: KhatmData, origin: string): Promise<void>
	sendError(message: string, meta?: unknown): Promise<void>
}
