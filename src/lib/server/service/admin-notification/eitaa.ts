import type { TKhatm } from '@prisma/client'
import { rebaseFullPath } from '$lib/utility/path'
import type { AdminNotification } from './adminNotification'

import { env } from '$env/dynamic/private'

const token = env.EITAA_TOKEN
const chatId = env.EITAA_CHAT_ID

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
		return !!(token && chatId)
	}

	private async request(method: string, data: object) {
		const url = `https://eitaayar.ir/api/${token}/${method}`
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
		await this.requestSendMessage({
			chat_id: chatId,
			text,
		})
	}

	async sendNewKhatm(khatm: TKhatm, origin: string) {
		const message = [
			`ختم جدید در ${origin}`,
			`عنوان: ${khatm.title} (${khatm.rangeType})`,
			`شرح: ${khatm.description}`,
			'',
			`${rebaseFullPath('/admin/showcase', origin)}`,
		].join('\n')

		await this.send(message)
	}
}
