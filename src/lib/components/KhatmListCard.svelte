<script lang="ts">
	import type { Khatm } from '$lib/entity/Khatm.svelte'
	import type { Snippet } from 'svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import IconArrow from '~icons/ic/round-arrow-back'

	type Props = {
		khatm: Khatm
		meta?: string
		showDescription?: boolean
		actions?: Snippet
	}

	let { khatm, meta, showDescription = false, actions }: Props = $props()
</script>

<article class:ui-khatm-list-card-finished={khatm.finished} class="ui-khatm-list-card">
	<span class="ui-khatm-list-card-icon" aria-hidden="true"><RangeTypeIcon type={khatm.rangeType} /></span>

	<div class="ui-khatm-list-card-main">
		<div class="ui-khatm-list-card-heading">
			<a href={khatm.link}>{khatm.title}</a>
			<span class="ui-khatm-list-card-badges">
				{#if khatm.finished}
					<span class="ui-badge ui-badge-xs ui-badge-success">کامل‌شده</span>
				{/if}
				{#if khatm.private}
					<span class="ui-badge ui-badge-xs ui-badge-info">خصوصی</span>
				{/if}
				{#if !khatm.isFree}
					<span class:ui-badge-info={khatm.isAyahOriented} class="ui-badge ui-badge-xs">
						{khatm.rangeTypeTitle}
					</span>
				{/if}
			</span>
		</div>

		{#if showDescription && khatm.description}
			<p class="ui-khatm-list-card-description">{khatm.description}</p>
		{/if}

		<div class="ui-khatm-list-card-meta">
			{#if meta}<span>{meta}</span>{/if}
			<span class="ui-khatm-list-card-progress">
				<span>{khatm.percent.toLocaleString('fa')}٪</span>
				<progress
					class="ui-progress ui-progress-success"
					max={100}
					value={khatm.percent}
					aria-label={`پیشرفت ختم ${khatm.title}`}
				></progress>
			</span>
		</div>
	</div>

	{#if actions}
		<div class="ui-khatm-list-card-actions">
			{@render actions()}
		</div>
	{:else}
		<a class="ui-khatm-list-card-arrow" href={khatm.link} aria-label={`مشاهده ختم ${khatm.title}`}>
			<IconArrow />
		</a>
	{/if}
</article>
