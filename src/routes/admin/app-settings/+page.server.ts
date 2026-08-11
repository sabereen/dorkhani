import {
	appSettings_store,
	appSettingsService_setKey,
	MAX_STALE_KHATM_RETENTION_DAYS,
	MIN_STALE_KHATM_RETENTION_DAYS,
} from '$service/appSettings'
import { auth_ensureIsAdmin } from '$service/auth'
import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = () => {
	const { supportLink, staleKhatmRetentionDays, notification } = appSettings_store.config

	return {
		supportLink,
		staleKhatmRetentionDays,
		notification: {
			...notification,
			eitaaToken: notification.eitaaToken ? 'unchanged' : '',
		},
	}
}

export const actions = {
	default: async (event) => {
		auth_ensureIsAdmin(event)

		const { config } = appSettings_store

		const form = await event.request.formData()

		const eitaa = form.get('eitaa') === 'on'
		const eitaaChatId = form.get('eitaaChatId')?.toString()
		const eitaaToken = form.get('eitaaToken')?.toString()
		const finalEitaaToken = eitaaToken === 'unchanged' ? config.notification.eitaaToken : eitaaToken

		const supportLink = form.get('supportLink')?.toString()
		const staleKhatmRetentionDays = Number(form.get('staleKhatmRetentionDays'))
		if (
			!Number.isInteger(staleKhatmRetentionDays) ||
			staleKhatmRetentionDays < MIN_STALE_KHATM_RETENTION_DAYS ||
			staleKhatmRetentionDays > MAX_STALE_KHATM_RETENTION_DAYS
		) {
			return fail(400, {
				errorMessage: `مهلت حذف باید عددی بین ${MIN_STALE_KHATM_RETENTION_DAYS} تا ${MAX_STALE_KHATM_RETENTION_DAYS} روز باشد.`,
				supportLink,
				staleKhatmRetentionDays,
				eitaa,
				eitaaChatId,
				eitaaToken,
			})
		}

		if (supportLink !== config.supportLink) {
			await appSettingsService_setKey('supportLink', supportLink)
		}
		if (staleKhatmRetentionDays !== config.staleKhatmRetentionDays) {
			await appSettingsService_setKey('staleKhatmRetentionDays', staleKhatmRetentionDays)
		}

		if (
			eitaa !== config.notification.eitaa ||
			eitaaToken !== 'unchanged' ||
			eitaaChatId !== config.notification.eitaaChatId
		) {
			await appSettingsService_setKey('notification', {
				eitaa: eitaa,
				eitaaChatId: eitaaChatId,
				eitaaToken: finalEitaaToken,
			})
		}

		return {
			supportLink,
			staleKhatmRetentionDays,
			eitaa,
			eitaaChatId,
			eitaaToken,
		}
	},
} satisfies Actions
