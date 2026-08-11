<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import { handleError } from '$lib/utility/handleError'
	import IconVolunteer from '~icons/ic/round-volunteer-activism'
	import IconEye from '~icons/ic/round-visibility'
	import IconCheck from '~icons/ic/round-check-circle'

	type Props = {
		range: QuranRange | null
		khatm: Khatm
		onClose?: () => void
		onFinished?: () => void
	}

	let { range, khatm, onClose, onFinished }: Props = $props()

	let loading = $state(false)

	/** سهم انتخاب‌شده را برای این مشارکت ثبت می‌کند. */
	async function pickRange() {
		if (loading || !range) return
		loading = true
		try {
			await khatm.pickRange(range)
			await khatm.refresh().catch()
			onFinished?.()
		} catch (err) {
			await khatm.refresh().catch()
			handleError(err)
			if ((err as App.Error)?.type === 'conflict-ranges') {
				onClose?.()
			}
		} finally {
			loading = false
		}
	}
</script>

{#if range}
	<div class="ui-khatm-confirm ui-khatm-confirm-review">
		<span class="ui-khatm-confirm-icon"><IconVolunteer /></span>
		<span class="ui-khatm-wizard-kicker">بررسی نهایی انتخاب</span>
		<h2>این سهم را برای قرائت برمی‌دارید؟</h2>
		<p class="ui-khatm-confirm-description">پس از تأیید، این بازه به‌عنوان سهم شما ثبت می‌شود تا همراه دیگری آن را انتخاب نکند.</p>

		<div class="ui-khatm-confirm-range">
			<IconCheck aria-hidden="true" />
			<div><span>سهم انتخاب‌شده</span><strong>{range.getTitle()}</strong></div>
		</div>

		<a href={range.getLink(khatm)} target="_blank" rel="noreferrer" class="ui-btn ui-btn-soft ui-btn-sm">
			<IconEye />
			دیدن آیات پیش از تأیید
		</a>

		<div class="ui-khatm-confirm-actions">
			<button class="ui-btn ui-btn-primary" disabled={loading} onclick={pickRange}>
				{#if loading}<span class="ui-spinner"></span>{/if}
				{loading ? 'در حال ثبت سهم…' : 'بله، این سهم را برمی‌دارم'}
			</button>
			<button class="ui-btn ui-btn-ghost" disabled={loading} onclick={onClose}>انتخاب بازه دیگر</button>
		</div>
	</div>
{:else}
	<div class="ui-khatm-empty ui-khatm-wizard-empty">
		<h3>این بازه دیگر آزاد نیست</h3>
		<p>یکی از همراهان کمی زودتر آن را انتخاب کرده است. لطفاً بازه دیگری بردارید.</p>
		<button class="ui-btn ui-btn-primary" type="button" onclick={onClose}>دیدن بازه‌های آزاد</button>
	</div>
{/if}
