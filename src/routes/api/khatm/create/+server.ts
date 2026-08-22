import type { CreateKhatmResult } from '$lib/contracts/api'
import type { RangeType } from '$lib/contracts/domain'
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
import { json, type RequestHandler } from '@sveltejs/kit'

const rangeTypes = new Set<RangeType>(['free', 'page', 'hizbQuarter', 'surah', 'juz', 'ayah'])

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null)
	const title = typeof body?.title === 'string' ? body.title.trim() : ''
	const rangeType = typeof body?.rangeType === 'string' ? body.rangeType : ''
	const description = typeof body?.description === 'string' ? body.description.trim() : ''
	const isPrivate = body?.private === true
	const hasSeries = body?.series === true
	const force = body?.force === true
	const aiReviewId = typeof body?.aiReviewId === 'string' ? body.aiReviewId : ''
	if (!title || title.length > 100) {
		return json({ errorMessage: 'عنوان اجباری است.' } satisfies CreateKhatmResult, { status: 400 })
	}
	if (!rangeTypes.has(rangeType as RangeType)) {
		return json({ errorMessage: 'نوع بازه معتبر نیست.' } satisfies CreateKhatmResult, { status: 400 })
	}

	const reviewInput = { title, description }
	let aiResult: AiReviewResult
	let delayedReview: Promise<AiReviewResult> | null = null
	let forcedReviewId: string | null = null
	if (force) {
		const warning = await aiKhatmReview_consumeWarning(aiReviewId, reviewInput)
		if (!warning) {
			return json(
				{ errorMessage: 'نتیجهٔ بررسی منقضی شده است؛ دوباره تلاش کنید.' } satisfies CreateKhatmResult,
				{ status: 409 },
			)
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
			return json(
				{ aiWarning: { id: review.id, reason: quickResult.reason } } satisfies CreateKhatmResult,
				{ status: 409 },
			)
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
		await aiKhatmReview_createForKhatm(khatm.id, reviewInput, aiResult, deadline).catch((error) =>
			console.error('Failed to save AI khatm review.', error),
		)
		if (delayedReview) aiKhatmReview_continue(khatm.id, delayedReview)
	}
	if (hasSeries) {
		const createdSeries = await khatmSeries_createForKhatmId(khatm.id)
		khatm.seriesId = createdSeries.id
	}
	if (!isPrivate) getNotificationProvider().sendNewKhatm(khatm, event.url.origin)

	return json({ khatm, guestClaimToken } satisfies CreateKhatmResult)
}
