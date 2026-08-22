import {
	appSettings_store,
	appSettingsService_setConfig,
	MAX_STALE_KHATM_RETENTION_DAYS,
	MIN_STALE_KHATM_RETENTION_DAYS,
} from '$service/appSettings'
import { BrandingImageError, processBrandingImages } from '$service/brandingAssets'
import { auth_ensureIsAdmin } from '$service/auth'
import { randomUUID } from 'node:crypto'
import { base } from '$app/paths'
import { getPublicBranding } from '$lib/entity/Branding'
import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = () => {
	const { supportLink, staleKhatmRetentionDays, notification } = appSettings_store.config
	const { aiKhatmReview, branding } = appSettings_store.config

	return {
		supportLink,
		staleKhatmRetentionDays,
		notification: {
			...notification,
			eitaaToken: notification.eitaaToken ? 'unchanged' : '',
		},
		aiKhatmReview: {
			...aiKhatmReview,
			apiKey: aiKhatmReview.apiKey ? 'unchanged' : '',
		},
		branding: getPublicBranding(branding, base),
	}
}

const brandingLimits = {
	name: 60,
	tagline: 100,
	heroTitle: 120,
	heroHighlight: 120,
	heroDescription: 500,
	heroImageAlt: 160,
	seoTitle: 120,
	seoDescription: 200,
} as const

const brandingLabels: Record<keyof typeof brandingLimits, string> = {
	name: 'نام برنامه',
	tagline: 'شعار کوتاه',
	heroTitle: 'خط اول عنوان Hero',
	heroHighlight: 'خط برجستهٔ عنوان Hero',
	heroDescription: 'توضیح Hero',
	heroImageAlt: 'متن جایگزین تصویر Hero',
	seoTitle: 'عنوان SEO',
	seoDescription: 'توضیح SEO',
}

function readBranding(form: FormData) {
	const branding = Object.fromEntries(
		Object.keys(brandingLimits).map((key) => [key, form.get(key)?.toString().trim() || '']),
	) as Record<keyof typeof brandingLimits, string>
	for (const [key, maxLength] of Object.entries(brandingLimits) as [
		keyof typeof brandingLimits,
		number,
	][]) {
		if (!branding[key]) throw new Error('تکمیل همهٔ متن‌های بخش برندینگ ضروری است.')
		if (branding[key].length > maxLength) {
			throw new Error(
				`مقدار «${brandingLabels[key]}» نباید بیشتر از ${maxLength.toLocaleString('fa')} نویسه باشد.`,
			)
		}
	}
	return branding
}

export const actions = {
	default: async (event) => {
		auth_ensureIsAdmin(event)

		const { config } = appSettings_store

		const form = await event.request.formData()
		let brandingInput: ReturnType<typeof readBranding>
		try {
			brandingInput = readBranding(form)
		} catch (error) {
			return fail(400, { errorMessage: error instanceof Error ? error.message : 'اطلاعات برندینگ معتبر نیست.' })
		}

		const eitaa = form.get('eitaa') === 'on'
		const eitaaChatId = form.get('eitaaChatId')?.toString()
		const eitaaToken = form.get('eitaaToken')?.toString()
		const finalEitaaToken = eitaaToken === 'unchanged' ? config.notification.eitaaToken : eitaaToken
		const aiKhatmReviewEnabled = form.get('aiKhatmReviewEnabled') === 'on'
		const aiKhatmReviewBaseUrl = form.get('aiKhatmReviewBaseUrl')?.toString().trim() || ''
		const aiKhatmReviewModel = form.get('aiKhatmReviewModel')?.toString().trim() || ''
		const aiKhatmReviewApiKey = form.get('aiKhatmReviewApiKey')?.toString() || ''
		const finalAiKhatmReviewApiKey =
			aiKhatmReviewApiKey === 'unchanged'
				? config.aiKhatmReview.apiKey
				: aiKhatmReviewApiKey

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

		if (aiKhatmReviewEnabled) {
			try {
				new URL(aiKhatmReviewBaseUrl)
			} catch {
				return fail(400, { errorMessage: 'نشانی سرویس AI معتبر نیست.' })
			}
			if (!aiKhatmReviewModel || !finalAiKhatmReviewApiKey) {
				return fail(400, { errorMessage: 'مدل و کلید API برای فعال‌سازی AI الزامی است.' })
			}
		}
		const nextAiKhatmReview = {
			enabled: aiKhatmReviewEnabled,
			baseUrl: aiKhatmReviewBaseUrl,
			model: aiKhatmReviewModel,
			apiKey: finalAiKhatmReviewApiKey,
		}
		let brandingAssets
		try {
			brandingAssets = await processBrandingImages(form)
		} catch (error) {
			return fail(400, {
				errorMessage:
					error instanceof BrandingImageError ? error.message : 'پردازش تصاویر برندینگ ناموفق بود.',
			})
		}
		const brandingChanged = Object.entries(brandingInput).some(
			([key, value]) => config.branding[key as keyof typeof brandingInput] !== value,
		)
		const assetsChanged = Boolean(
			brandingAssets.hero || brandingAssets.icon192 || brandingAssets.icon512,
		)
		const branding = {
			...brandingInput,
			revision:
				brandingChanged || assetsChanged ? randomUUID() : config.branding.revision,
		}

		await appSettingsService_setConfig(
			{
				supportLink,
				staleKhatmRetentionDays,
				notification: {
					eitaa,
					eitaaChatId,
					eitaaToken: finalEitaaToken,
				},
				aiKhatmReview: nextAiKhatmReview,
				branding,
			},
			brandingAssets,
		)

		return {
			supportLink,
			staleKhatmRetentionDays,
			eitaa,
			eitaaChatId,
			eitaaToken,
			aiKhatmReview: {
				...nextAiKhatmReview,
				apiKey: nextAiKhatmReview.apiKey ? 'unchanged' : '',
			},
			branding,
		}
	},
} satisfies Actions
