<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconHistory from '~icons/ic/round-history'
	import HistoryKhatm from './history-khatm.svelte'
	import HistoryPickedRange from './history-picked-range.svelte'
	import * as m from '$lib/paraglide/messages.js'
	import HistoryZekr from './history-zekr.svelte'
</script>

<PageTitle title={m.history_title()} />

<Header title={m.history_title()} />

<div class="history-page">
	<section class="history-intro">
		<span class="history-intro-icon"><IconHistory /></span>
		<div>
			<h2>{m.history_heading()}</h2>
			<p>{m.history_description()}</p>
		</div>
	</section>

	<div class="history-grid">
		<HistoryKhatm title={m.history_created()}>
			{#snippet fallback()}
				<div class="history-empty">{m.history_created_empty()}</div>
			{/snippet}
		</HistoryKhatm>

		<HistoryZekr title={m.history_zekr()}>
			{#snippet fallback()}
				<div class="history-empty">{m.history_zekr_empty()}</div>
			{/snippet}
		</HistoryZekr>

		<HistoryPickedRange title={m.history_picked()}>
			{#snippet fallback()}
				<div class="history-empty">{m.history_picked_empty()}</div>
			{/snippet}
		</HistoryPickedRange>
	</div>
</div>

<style>
	.history-page {
		padding-top: 1.5rem;
	}

	.history-intro {
		display: flex;
		align-items: center;
		padding: 1.5rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.5rem;
		background: linear-gradient(135deg, var(--ui-color-primary-soft), var(--ui-color-surface));
	}

	.history-intro > * + * {
		margin-inline-start: 1rem;
	}

	.history-intro-icon {
		display: flex;
		width: 3.5rem;
		height: 3.5rem;
		flex: 0 0 3.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		background: var(--ui-color-primary);
		color: var(--ui-color-on-primary);
	}

	.history-intro-icon :global(svg) {
		width: 1.75rem;
		height: 1.75rem;
	}

	.history-intro h2,
	.history-intro p {
		margin: 0;
	}

	.history-intro h2 {
		font-size: 1.2rem;
		font-weight: 900;
	}

	.history-intro p {
		margin-top: 0.3rem;
		color: var(--ui-color-text-muted);
		font-size: 0.85rem;
		line-height: 1.8;
	}

	.history-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 1rem;
		align-items: start;
		margin-top: 1rem;
	}

	.history-empty {
		padding: 2rem 1rem;
		border: 1px dashed var(--ui-color-border-strong);
		border-radius: 1.25rem;
		background: var(--ui-color-surface-muted);
		color: var(--ui-color-text-muted);
		text-align: center;
	}

	@media (max-width: 1023px) {
		.history-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 767px) {
		.history-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.history-intro {
			align-items: flex-start;
			padding: 1.25rem;
		}
	}
</style>
