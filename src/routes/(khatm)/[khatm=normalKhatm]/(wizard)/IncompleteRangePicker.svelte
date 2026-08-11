<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { KhatmPart } from '$lib/entity/KhatmPart'
	import type { KhatmParticipation } from '$lib/entity/KhatmParticipation.svelte'
	import type { QuranRange } from '$lib/entity/Range'
	import ConfirmRange from '../confirm-range.svelte'

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

	function continueToConfirmation() {
		if (!selectedRange) return
		confirming = true
	}

	function finish() {
		if (selectedRange) onFinished(selectedRange)
	}
</script>

{#if confirming && selectedRange}
	<div class="ui-khatm-partial-confirm-back">
		<button type="button" class="ui-btn ui-btn-ghost ui-btn-sm" onclick={() => (confirming = false)}>
			بازگشت به زیربازه‌ها
		</button>
	</div>
	<ConfirmRange {khatm} onClose={onClose} onFinished={finish} range={selectedRange} />
{:else}
	<div class="ui-khatm-partial-picker">
		<div class="ui-khatm-partial-heading">
			<div
				class="ui-radial-progress"
				style:--value={percent}
				style:--size="3.25rem"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={percent}
				aria-label={`${percent.toLocaleString('fa')} درصد انتخاب شده`}
				role="progressbar"
			>
				&lrm;{percent.toLocaleString('fa')}٪&lrm;
			</div>
			<div>
				<span class="ui-badge ui-badge-info ui-badge-xs">بازهٔ ناقص</span>
				<h2>یک بخش آزاد را انتخاب کنید</h2>
				<p>{range.title || range.getTitleSurahOrinted()}</p>
			</div>
		</div>

		<p class="ui-khatm-partial-help">
			بخش‌های پیوستهٔ این بازه در ادامه آمده‌اند. یکی از بخش‌های آزاد را علامت بزنید.
		</p>

		<ul class="ui-khatm-partial-list" aria-label="زیربازه‌های آزاد و انتخاب‌شده">
			{#each subranges as { range: subrange, khatmPart } (subrange.start + ':' + subrange.end)}
				{@const mine =
					!!khatmPart && participation.getOverlapLength(subrange) === subrange.length}
				<li>
					{#if khatmPart}
						<div
							class="ui-khatm-partial-item ui-khatm-partial-item-picked"
							class:ui-khatm-partial-item-mine={mine}
						>
							<span class="ui-khatm-partial-item-title">{subrange.getTitleSurahOrinted()}</span>
							{#if mine}
								<span class="ui-badge ui-badge-accent ui-badge-xs">سهم شما</span>
							{:else}
								<span class="ui-badge ui-badge-success ui-badge-xs">انتخاب‌شده</span>
							{/if}
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
							<span class="ui-badge ui-badge-info ui-badge-xs">آزاد</span>
						</label>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="ui-khatm-confirm-actions">
			<button
				type="button"
				class="ui-btn ui-btn-primary"
				disabled={!selectedRange}
				onclick={continueToConfirmation}
			>
				ادامه
			</button>
			<button type="button" class="ui-btn ui-btn-ghost" onclick={onClose}>انصراف</button>
		</div>
	</div>
{/if}
