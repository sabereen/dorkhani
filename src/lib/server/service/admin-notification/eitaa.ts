import type { TKhatm } from '@prisma/client'
import { rebaseFullPath } from '$lib/utility/path'
import { appSettings_store } from '$service/appSettings'
import type { AdminNotification } from './adminNotification'
import { base } from '$app/paths'

type SendMessageBody = {
	chat_id: string | number
	text: string
	title?: string
	notification_disable?: 1
	pin?: 1
	id_message_to_reply?: number
	date?: number // timestamp
	viewCountForDelete?: number
}

export class EitaaAdminNotification implements AdminNotification {
	static enabled() {
		const { eitaa, eitaaChatId, eitaaToken } = appSettings_store.config.notification
		return !!(eitaa && eitaaChatId && eitaaToken)
	}

	private async request(method: string, data: object) {
		const { eitaaToken } = appSettings_store.config.notification
		const url = `https://eitaayar.ir/api/${eitaaToken}/${method}`
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'content-type': 'application/json',
			},
		})
		const result = response.json()
		return result
	}

	private requestSendMessage(body: SendMessageBody) {
		return this.request('sendMessage', body)
	}

	async send(text: string) {
		const { eitaaChatId } = appSettings_store.config.notification
		await this.requestSendMessage({
			chat_id: eitaaChatId!,
			text,
		})
	}

	async sendNewKhatm(khatm: TKhatm, origin: string) {
		const message = [
			`ختم جدید در ${origin}${base}`,
			`عنوان: ${khatm.title} (${khatm.rangeType})`,
			`شرح: ${khatm.description}`,
			'',
			`${rebaseFullPath('/admin/showcase', origin)}`,
		].join('\n')

		await this.send(message)
	}

	async sendError(message: string, meta = ''): Promise<void> {
		let metaToShow = String(meta)
		try {
			metaToShow = JSON.stringify(meta, null, 2)
		} catch {
			/* empty */
		}

		const msg = ['خطای غیر منتظره', message, metaToShow].join('\n')

		await this.send(msg)
	}
}
