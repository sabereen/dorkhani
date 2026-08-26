<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import type { ReviewStatus } from '$lib/contracts/domain'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { featuredKhatm_set } from '$lib/entity/KhatmFeatured'
	import { toast } from '$lib/components/TheToast.svelte'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconStar from '~icons/ic/round-star'
	import IconStarOutline from '~icons/ic/round-star-border'
	import * as m from '$lib/paraglide/messages.js'

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
			pending: m.khatm_review_pending(),
			approved: m.khatm_review_approved(),
			rejected: m.khatm_review_rejected(),
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
		return m.khatm_review_error()
	}

	async function updateReviewStatus(reviewStatus: ReviewAction) {
		if (reviewLoading || featureLoading) return
		reviewLoading = reviewStatus
		message = ''

		try {
			await khatm.update({ reviewStatus })
			if (reviewStatus === 'rejected') currentFeaturedOrder = null
			message = reviewStatus === 'approved' ? m.khatm_review_approved_message() : m.khatm_review_rejected_message()
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
			message = featured ? m.khatm_feature_added() : m.khatm_feature_removed()
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
			<p class="ui-khatm-review-eyebrow">{m.khatm_review_eyebrow()}</p>
			<h2 id="khatm-review-title">{m.khatm_review_title()}</h2>
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
				{reviewLoading === 'approved' ? m.khatm_review_save() : m.khatm_review_approve()}
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
				{reviewLoading === 'rejected' ? m.khatm_review_save() : m.khatm_review_reject()}
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
				<strong>{m.khatm_feature_title()}</strong>
				{#if currentFeaturedOrder != null}
					<span>{m.khatm_feature_position({ position: currentFeaturedOrder.toLocaleString(localeTag()) })}</span>
				{:else if featureAllowed}
					<span>{m.khatm_feature_ready()}</span>
				{:else if canFeature}
					<span>{m.khatm_feature_approval_hint()}</span>
				{:else}
					<span>{m.khatm_feature_unavailable()}</span>
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
				{featureLoading ? m.khatm_review_save() : m.khatm_remove_feature()}
			</button>
		{:else if featureAllowed}
			<button
				class="ui-btn ui-btn-secondary ui-btn-sm"
				type="button"
				disabled={Boolean(reviewLoading || featureLoading)}
				onclick={() => updateFeatured(true)}
			>
				<IconStar />
				{featureLoading ? m.khatm_review_save() : m.khatm_add_feature()}
			</button>
		{/if}
	</div>

	<p class="ui-khatm-review-message" aria-live="polite">{message}</p>
</section>
