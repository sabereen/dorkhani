<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { KhatmPart } from '$lib/entity/KhatmPart'
	import type { KhatmParticipation } from '$lib/entity/KhatmParticipation.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import ConfirmRange from '../confirm-range.svelte'
	import IconArrowForward from '~icons/ic/round-arrow-forward'
	import IconCheck from '~icons/ic/round-check'
	import IconLayers from '~icons/ic/round-layers'

	type Props = {
		range: QuranRange
		parts: KhatmPart[]
		participation: KhatmParticipation
		khatm: Khatm
		onClose: () => void
		onFinished: (range: QuranRange) => void
	}

	let { range, parts, participation, khatm, onClose, onFinished }: Props = $props()

	let selectedRange = $state<QuranRange | null>(null)
	let confirming = $state(false)

	const percent = $derived(range.getFillPercent(parts))
	const subranges = $derived(range.divideByKahtmParts(parts))
	const availableCount = $derived(subranges.filter(({ khatmPart }) => !khatmPart).length)

	function continueToConfirmation() {
		if (!selectedRange) return
		confirming = true
	}

	function finish() {
		if (selectedRange) onFinished(selectedRange)
	}
</script>

{#if confirming && selectedRange}
	<button
		type="button"
		class="ui-btn ui-btn-ghost ui-btn-sm ui-khatm-partial-back"
		onclick={() => (confirming = false)}
	>
		<IconArrowForward />
		بازگشت به بخش‌های آزاد
	</button>
	<ConfirmRange {khatm} {onClose} onFinished={finish} range={selectedRange} />
{:else}
	<div class="ui-khatm-partial-picker">
		<header class="ui-khatm-partial-heading">
			<span class="ui-khatm-partial-heading-icon"><IconLayers /></span>
			<div>
				<span class="ui-khatm-wizard-kicker">انتخاب از یک بازه نیمه‌تکمیل</span>
				<h2>بخش آزاد دل‌خواهتان را بردارید</h2>
				<p>{range.title || range.getTitleSurahOrinted()}</p>
			</div>
		</header>

		<div class="ui-khatm-partial-summary">
			<div>
				<strong>{availableCount.toLocaleString('fa')}</strong>
				<span>بخش آزاد</span>
			</div>
			<div>
				<span><b>{percent.toLocaleString('fa')}٪</b> از این بازه پیش‌تر انتخاب شده است</span>
				<progress
					class="ui-progress"
					max={100}
					value={percent}
					aria-label={`${percent.toLocaleString('fa')} درصد انتخاب شده`}
				></progress>
			</div>
		</div>

		<p class="ui-khatm-partial-help">
			یک ردیف با نشان «آزاد» را انتخاب کنید. بخش‌های کم‌رنگ پیش‌تر برداشته شده‌اند.
		</p>

		<ul class="ui-khatm-partial-list" aria-label="بخش‌های این بازه">
			{#each subranges as { range: subrange, khatmPart } (subrange.start + ':' + subrange.end)}
				{@const mine = !!khatmPart && participation.getOverlapLength(subrange) === subrange.length}
				<li>
					{#if khatmPart}
						<div
							class="ui-khatm-partial-item ui-khatm-partial-item-picked"
							class:ui-khatm-partial-item-mine={mine}
						>
							<span class="ui-khatm-partial-item-marker"><IconCheck /></span>
							<span class="ui-khatm-partial-item-title">{subrange.getTitleSurahOrinted()}</span>
							<span
								class="ui-badge ui-badge-xs"
								class:ui-badge-accent={mine}
								class:ui-badge-neutral={!mine}
							>
								{mine ? 'سهم شما' : 'برداشته شده'}
							</span>
						</div>
					{:else}
						<label
							class="ui-khatm-partial-item ui-khatm-partial-item-free"
							class:ui-khatm-partial-item-selected={selectedRange === subrange}
						>
							<input
								type="radio"
								class="ui-radio"
								name="available-subrange"
								value={subrange}
								bind:group={selectedRange}
							/>
							<span class="ui-khatm-partial-item-title">{subrange.getTitleSurahOrinted()}</span>
							<span class="ui-badge ui-badge-success ui-badge-xs">آزاد</span>
						</label>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="ui-khatm-partial-selection" aria-live="polite">
			<div>
				<span>انتخاب شما</span>
				<strong
					>{selectedRange
						? selectedRange.getTitleSurahOrinted()
						: 'هنوز بخشی انتخاب نشده است'}</strong
				>
			</div>
			<button
				type="button"
				class="ui-btn ui-btn-primary"
				disabled={!selectedRange}
				onclick={continueToConfirmation}
			>
				ادامه و بررسی نهایی
			</button>
		</div>
		<button type="button" class="ui-btn ui-btn-ghost ui-btn-block" onclick={onClose}
			>انصراف از انتخاب</button
		>
	</div>
{/if}
