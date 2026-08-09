import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import type { RangeType } from '@prisma-client'
import { khatmService_create } from '$service/khatm'
import { getNotificationProvider } from '$service/admin-notification'
import { khatmSeries_createForKhatmId } from '$service/khatmSeries'

export const load: PageServerLoad = ({ url }) => {
	return {
		rangeType: url.searchParams.get('rangeType'),
	}
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const title = form.get('title')
		const rangeType = String(form.get('rangeType'))
		const description = form.get('description') || ''
		const isPrivate = form.get('access') === 'private'
		const hasSeries = form.get('series') === 'on'

		if (!title) {
			return fail(400, { errorMessage: 'عنوان اجباری است.' })
		}

		const { khatm, guestClaimToken } = await khatmService_create(
			{
				title: String(title).trim(),
				description: String(description).trim(),
				rangeType: rangeType as RangeType,
				private: isPrivate,
			},
			event.locals.user?.id,
		)

		if (hasSeries) {
			const series = await khatmSeries_createForKhatmId(khatm.id)
			khatm.seriesId = series.id
		}

		if (!isPrivate) {
			const notif = getNotificationProvider()
			notif.sendNewKhatm(khatm, event.url.origin)
		}

		return { khatm, guestClaimToken }
	},
} satisfies Actions
