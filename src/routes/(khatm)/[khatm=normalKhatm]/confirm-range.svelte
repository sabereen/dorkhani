<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import { handleError } from '$lib/utility/handleError'
	import IconVolunteer from '~icons/ic/round-volunteer-activism'
	import IconEye from '~icons/ic/round-visibility'

	type Props = {
		range: QuranRange | null
		khatm: Khatm
		onClose?: () => void
		onFinished?: () => void
	}

	let { range, khatm, onClose, onFinished }: Props = $props()

	let loading = $state(false)
	/** قسمت انتخاب شده را به عنوان خوانده شده علامت می‌زند */
	async function markAsRead() {
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
	<div class="ui-khatm-confirm">
		<div class="ui-khatm-confirm-heading">
			<span class="ui-khatm-confirm-icon"><IconVolunteer /></span>
			<h2>پذیرفتن این سهم از ختم</h2>
		</div>
		<p class="ui-khatm-confirm-range">{range.getTitle()}</p>
		<a href={range.getLink(khatm)} target="_blank" class="ui-btn ui-btn-ghost ui-btn-sm">
			<IconEye />
			پیش‌نمایش آیات
		</a>
		<p class="ui-text-muted text-sm">با تأیید، این بازه به نام شما از بخش‌های آزاد کنار گذاشته می‌شود.</p>
		<div class="ui-khatm-confirm-actions">
			<button class="ui-btn ui-btn-primary" disabled={loading} onclick={markAsRead}>
				{#if loading}<span class="ui-spinner"></span>{/if}
				می‌پذیرم
			</button>
			<button class="ui-btn ui-btn-ghost" disabled={loading} onclick={onClose}>فعلاً نه</button>
		</div>
	</div>
{:else}
	<div class="ui-khatm-empty"><p>این بازه پیش‌تر برای قرائت انتخاب شده است.</p></div>
{/if}
