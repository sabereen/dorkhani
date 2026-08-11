<script lang="ts">
	import type { ReviewStatus } from '@prisma-client'
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'

	type ReviewAction = Extract<ReviewStatus, 'approved' | 'rejected'>
	type Props = { khatm: Khatm }

	const { khatm }: Props = $props()
	let loading = $state<ReviewAction | null>(null)
	let message = $state('')

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
		return 'تغییر وضعیت ختم انجام نشد. دوباره تلاش کنید.'
	}

	async function updateReviewStatus(reviewStatus: ReviewAction) {
		if (loading) return
		loading = reviewStatus
		message = ''

		try {
			await khatm.update({ reviewStatus })
			message = reviewStatus === 'approved' ? 'ختم تأیید شد.' : 'ختم رد شد.'
			toast('info', message)
		} catch (cause) {
			message = getErrorMessage(cause)
			toast('error', message)
		} finally {
			loading = null
		}
	}
</script>

<section
	class="ui-khatm-review-bar"
	aria-labelledby="khatm-review-title"
	aria-busy={Boolean(loading)}
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
				disabled={Boolean(loading)}
				onclick={() => updateReviewStatus('approved')}
			>
				<IconApproved />
				{loading === 'approved' ? 'در حال ثبت…' : 'تأیید ختم'}
			</button>
		{/if}
		{#if khatm.reviewStatus !== 'rejected'}
			<button
				class="ui-btn ui-btn-danger ui-btn-sm"
				type="button"
				disabled={Boolean(loading)}
				onclick={() => updateReviewStatus('rejected')}
			>
				<IconRejected />
				{loading === 'rejected' ? 'در حال ثبت…' : 'رد ختم'}
			</button>
		{/if}
	</div>

	<p class="ui-khatm-review-message" aria-live="polite">{message}</p>
</section>
