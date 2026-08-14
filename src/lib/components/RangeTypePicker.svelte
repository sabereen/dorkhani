<script lang="ts">
	import type { RangeType } from '@prisma-client'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'

	type Props = {
		name?: string
		options?: RangeType[]
		value: RangeType
		disabled?: boolean
	}

	let {
		name = 'rangeType',
		options = ['free', 'page', 'hizbQuarter', 'surah', 'juz', 'ayah'],
		value = $bindable(),
		disabled = false,
	}: Props = $props()

	const details: Record<RangeType, string> = {
		free: 'آزاد',
		page: 'صفحه‌به‌صفحه',
		hizbQuarter: 'رُبعِ حزب',
		surah: 'سوره‌به‌سوره',
		juz: 'جزءبه‌جزء',
		ayah: 'ختم آیه‌ای',
	}
</script>

<div class="ui-range-type-picker" role="radiogroup" aria-label="انتخاب نوع بازه‌بندی">
	{#if options.includes('free')}
		<label
			class="ui-range-type-picker-option ui-range-type-picker-option-free"
			data-selected={value === 'free'}
			data-disabled={disabled}
		>
			<input class="ui-radio" type="radio" {name} value="free" bind:group={value} {disabled} />
			<span class="ui-range-type-picker-icon" aria-hidden="true"><RangeTypeIcon type="free" /></span>
			<span class="ui-range-type-picker-copy">
				<strong>{details.free}</strong>
				<small>هر همراه می‌تواند به اندازهٔ فرصت خودش، از بخش‌های آزاد قرآن انتخاب کند.</small>
			</span>
		</label>
	{/if}

	<div class="ui-range-type-picker-options">
		{#each options.filter((option) => option !== 'ayah' && option !== 'free') as option}
			<label
				class="ui-range-type-picker-option"
				data-selected={value === option}
				data-disabled={disabled}
			>
				<input class="ui-radio" type="radio" {name} value={option} bind:group={value} {disabled} />
				<span class="ui-range-type-picker-icon" aria-hidden="true"><RangeTypeIcon type={option} /></span>
				<span class="ui-range-type-picker-copy">
					<strong>{details[option]}</strong>
				</span>
			</label>
		{/each}
	</div>

	{#if options.includes('ayah')}
		<label
			class="ui-range-type-picker-option ui-range-type-picker-option-ayah"
			data-selected={value === 'ayah'}
			data-disabled={disabled}
		>
			<input class="ui-radio" type="radio" {name} value="ayah" bind:group={value} {disabled} />
			<span class="ui-range-type-picker-icon" aria-hidden="true"><RangeTypeIcon type="ayah" /></span>
			<span class="ui-range-type-picker-copy">
				<strong>{details.ayah}</strong>
				<small>
					آیه‌ها به‌ترتیب میان همراهان پخش می‌شوند؛ در این مدل، هر نفر یک بازهٔ دلخواه انتخاب نمی‌کند.
				</small>
			</span>
		</label>
	{/if}
</div>
