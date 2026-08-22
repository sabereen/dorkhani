<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import { handleError } from '$lib/utility/handleError'
	import IconVolunteer from '~icons/ic/round-volunteer-activism'
	import IconEye from '~icons/ic/round-visibility'
	import IconCheck from '~icons/ic/round-check-circle'
	import * as m from '$lib/paraglide/messages.js'

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
			if ((err as { type?: string })?.type === 'conflict-ranges') {
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
		<span class="ui-khatm-wizard-kicker">{m.wizard_confirm_eyebrow()}</span>
		<h2>{m.wizard_confirm_title()}</h2>
		<p class="ui-khatm-confirm-description">
			{m.wizard_confirm_description()}
		</p>

		<div class="ui-khatm-confirm-range">
			<IconCheck aria-hidden="true" />
			<div><span>{m.wizard_selected_share()}</span><strong>{range.getTitle()}</strong></div>
		</div>

		<a
			href={range.getLink(khatm)}
			target="_blank"
			rel="noreferrer"
			class="ui-btn ui-btn-soft ui-btn-sm"
		>
			<IconEye />
			{m.wizard_preview_before_confirm()}
		</a>

		<div class="ui-khatm-confirm-actions">
			<button class="ui-btn ui-btn-primary" disabled={loading} onclick={pickRange}>
				{#if loading}<span class="ui-spinner"></span>{/if}
				{loading ? m.wizard_confirm_loading() : m.wizard_confirm_action()}
			</button>
			<button class="ui-btn ui-btn-ghost" disabled={loading} onclick={onClose}
				>{m.wizard_choose_another_range()}</button
			>
		</div>
	</div>
{:else}
	<div class="ui-khatm-empty ui-khatm-wizard-empty">
		<h3>{m.wizard_range_taken_title()}</h3>
		<p>{m.wizard_range_taken_description()}</p>
		<button class="ui-btn ui-btn-primary" type="button" onclick={onClose}>{m.wizard_view_free_ranges()}</button
		>
	</div>
{/if}
