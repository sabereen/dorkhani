<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import type { ReviewStatus } from '@prisma-client'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { featuredKhatm_set } from '$lib/entity/KhatmFeatured'
	import { toast } from '$lib/components/TheToast.svelte'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconStar from '~icons/ic/round-star'
	import IconStarOutline from '~icons/ic/round-star-border'

	type ReviewAction = Extract<ReviewStatus, 'approved' | 'rejected'>
	type Props = { khatm: Khatm; featuredOrder?: number | null; canFeature?: boolean }

	const { khatm, featuredOrder: initialFeaturedOrder = null, canFeature = false }: Props = $props()
	const initialFeaturedOrderValue =
		/* svelte-ignore state_referenced_locally */ initialFeaturedOrder
	let reviewLoading = $state<ReviewAction | null>(null)
	let featureLoading = $state(false)
	let currentFeaturedOrder = $state(initialFeaturedOrderValue)
	let message = $state('')
	const featureAllowed = $derived(canFeature && khatm.reviewStatus === 'approved')

	const statusTitle = $derived(
		{
			pending: 'منتظر بررسی',
			approved: 'تأییدشده',
			rejected: 'ردشده',
		}[khatm.reviewStatus],
	)

	function getErrorMessage(cause: unknown) {
		if (
			cause &&
			typeof cause === 'object' &&
			'message' in cause &&
			typeof cause.message === 'string'
		) {
			return cause.message
		}
		return 'تغییرات مدیریتی ختم انجام نشد. دوباره تلاش کنید.'
	}

	async function updateReviewStatus(reviewStatus: ReviewAction) {
		if (reviewLoading || featureLoading) return
		reviewLoading = reviewStatus
		message = ''

		try {
			await khatm.update({ reviewStatus })
			if (reviewStatus === 'rejected') currentFeaturedOrder = null
			message = reviewStatus === 'approved' ? 'ختم تأیید شد.' : 'ختم رد شد.'
			toast('info', message)
		} catch (cause) {
			message = getErrorMessage(cause)
			toast('error', message)
		} finally {
			reviewLoading = null
		}
	}

	async function updateFeatured(featured: boolean) {
		if (reviewLoading || featureLoading) return
		featureLoading = true
		message = ''

		try {
			const { items } = await featuredKhatm_set(khatm.id, featured)
			currentFeaturedOrder =
				items.find((item) => item.khatm.seriesId === khatm.seriesId)?.featuredOrder ?? null
			message = featured ? 'ختم به فهرست شاخص‌ها افزوده شد.' : 'ختم از فهرست شاخص‌ها حذف شد.'
			toast('info', message)
		} catch (cause) {
			message = getErrorMessage(cause)
			toast('error', message)
		} finally {
			featureLoading = false
		}
	}
</script>

<section
	class="ui-khatm-review-bar"
	aria-labelledby="khatm-review-title"
	aria-busy={Boolean(reviewLoading || featureLoading)}
>
	<div class="ui-khatm-review-copy">
		<div>
			<p class="ui-khatm-review-eyebrow">مدیریت بررسی</p>
			<h2 id="khatm-review-title">وضعیت انتشار ختم</h2>
		</div>
		<span
			class:ui-badge-accent={khatm.reviewStatus === 'pending'}
			class:ui-badge-success={khatm.reviewStatus === 'approved'}
			class:ui-badge-neutral={khatm.reviewStatus === 'rejected'}
			class="ui-badge"
		>
			{statusTitle}
		</span>
	</div>

	<div class="ui-khatm-review-actions">
		{#if khatm.reviewStatus !== 'approved'}
			<button
				class="ui-btn ui-btn-success ui-btn-sm"
				type="button"
				disabled={Boolean(reviewLoading || featureLoading)}
				onclick={() => updateReviewStatus('approved')}
			>
				<IconApproved />
				{reviewLoading === 'approved' ? 'در حال ثبت…' : 'تأیید ختم'}
			</button>
		{/if}
		{#if khatm.reviewStatus !== 'rejected'}
			<button
				class="ui-btn ui-btn-danger ui-btn-sm"
				type="button"
				disabled={Boolean(reviewLoading || featureLoading)}
				onclick={() => updateReviewStatus('rejected')}
			>
				<IconRejected />
				{reviewLoading === 'rejected' ? 'در حال ثبت…' : 'رد ختم'}
			</button>
		{/if}
	</div>

	<div class="ui-khatm-feature-control">
		<div class="ui-khatm-feature-copy">
			<span
				class:ui-khatm-feature-icon-active={currentFeaturedOrder != null}
				class="ui-khatm-feature-icon"
			>
				{#if currentFeaturedOrder != null}<IconStar />{:else}<IconStarOutline />{/if}
			</span>
			<div>
				<strong>نمایش در ختم‌های شاخص</strong>
				{#if currentFeaturedOrder != null}
					<span>جایگاه {currentFeaturedOrder.toLocaleString(localeTag())} از فهرست صفحهٔ اصلی</span>
				{:else if featureAllowed}
					<span>این ختم دائمی آمادهٔ انتخاب است.</span>
				{:else if canFeature}
					<span>پس از تأیید انتشار، می‌توانید آن را شاخص کنید.</span>
				{:else}
					<span>فقط دنباله‌های عمومی و نامحدودِ در حال اجرا قابل انتخاب‌اند.</span>
				{/if}
			</div>
		</div>

		{#if currentFeaturedOrder != null}
			<button
				class="ui-btn ui-btn-outline ui-btn-sm"
				type="button"
				disabled={Boolean(reviewLoading || featureLoading)}
				onclick={() => updateFeatured(false)}
			>
				<IconStarOutline />
				{featureLoading ? 'در حال ثبت…' : 'حذف از شاخص‌ها'}
			</button>
		{:else if featureAllowed}
			<button
				class="ui-btn ui-btn-secondary ui-btn-sm"
				type="button"
				disabled={Boolean(reviewLoading || featureLoading)}
				onclick={() => updateFeatured(true)}
			>
				<IconStar />
				{featureLoading ? 'در حال ثبت…' : 'افزودن به شاخص‌ها'}
			</button>
		{/if}
	</div>

	<p class="ui-khatm-review-message" aria-live="polite">{message}</p>
</section>
