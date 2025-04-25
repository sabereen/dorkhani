import type { AdminNotification } from './adminNotification'

export class NoopAdminNotification implements AdminNotification {
	async send(): Promise<void> {}
	async sendNewKhatm() {}
	async sendError() {}
}
