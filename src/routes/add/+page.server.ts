import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import type { RangeType } from '@prisma-client'
import { khatmService_create } from '$service/khatm'
import { getNotificationProvider } from '$service/admin-notification'
import { khatmSeries_createForKhatmId } from '$service/khatmSeries'
import {
	aiKhatmReview_attachWarning,
	aiKhatmReview_consumeWarning,
	aiKhatmReview_continue,
	aiKhatmReview_createForKhatm,
	aiKhatmReview_createWarning,
	aiKhatmReview_review,
	AI_REVIEW_BACKGROUND_WAIT_MS,
	AI_REVIEW_INITIAL_WAIT_MS,
	type AiReviewResult,
} from '$service/aiKhatmReview'

export const load: PageServerLoad = ({ url }) => {
	return {
		rangeType: url.searchParams.get('rangeType'),
	}
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData()
		const title = String(form.get('title') || '').trim()
		const rangeType = String(form.get('rangeType'))
		const description = String(form.get('description') || '').trim()
		const isPrivate = form.get('access') === 'private'
		const hasSeries = form.get('series') === 'on'
		const force = form.get('force') === 'true'
		const aiReviewId = String(form.get('aiReviewId') || '')

		if (!title || title.length > 100) {
			return fail(400, { errorMessage: 'عنوان اجباری است.' })
		}

		const reviewInput = { title, description }
		let aiResult: AiReviewResult
		let delayedReview: Promise<AiReviewResult> | null = null
		let forcedReviewId: string | null = null

		if (force) {
			const warning = await aiKhatmReview_consumeWarning(aiReviewId, reviewInput)
			if (!warning) {
				return fail(409, { errorMessage: 'نتیجهٔ بررسی منقضی شده است؛ دوباره تلاش کنید.' })
			}
			aiResult = { status: 'warning', reason: warning.reason || 'عنوان یا توضیح ختم نیاز به اصلاح دارد.' }
			forcedReviewId = warning.id
		} else {
			const pendingReview = aiKhatmReview_review(reviewInput, {
				timeoutMs: AI_REVIEW_BACKGROUND_WAIT_MS,
			})
			const quickResult = await Promise.race<AiReviewResult | null>([
				pendingReview,
				new Promise((resolve) => setTimeout(() => resolve(null), AI_REVIEW_INITIAL_WAIT_MS)),
			])
			if (quickResult?.status === 'warning') {
				const review = await aiKhatmReview_createWarning(reviewInput, quickResult.reason)
				return fail(409, {
					aiWarning: { id: review.id, reason: quickResult.reason },
				})
			}
			if (quickResult == null) {
				aiResult = { status: 'pending', reason: null }
				delayedReview = pendingReview
			} else {
				aiResult = quickResult
			}
		}

		const { khatm, guestClaimToken } = await khatmService_create(
			{
				title,
				description,
				rangeType: rangeType as RangeType,
				private: isPrivate,
				reviewStatus: !isPrivate
					? force
						? 'rejected'
						: aiResult.status === 'clear'
							? 'approved'
							: undefined
					: undefined,
				aiReviewStatus: aiResult.status,
				aiReviewReason: aiResult.reason,
			},
			event.locals.user?.id,
		)

		if (forcedReviewId) {
			await aiKhatmReview_attachWarning(forcedReviewId, khatm.id).catch((error) => {
				console.error('Failed to attach forced AI khatm review.', error)
			})
		} else {
			const deadline = delayedReview ? new Date(Date.now() + AI_REVIEW_BACKGROUND_WAIT_MS) : undefined
			await aiKhatmReview_createForKhatm(khatm.id, reviewInput, aiResult, deadline).catch(
				(error) => console.error('Failed to save AI khatm review.', error),
			)
			if (delayedReview) aiKhatmReview_continue(khatm.id, delayedReview)
		}

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
