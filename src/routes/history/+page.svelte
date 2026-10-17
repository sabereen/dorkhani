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

<div class="ui-history-page">
	<section class="ui-history-intro">
		<span class="ui-history-intro-icon"><IconHistory /></span>
		<div>
			<h2>{m.history_heading()}</h2>
			<p>{m.history_description()}</p>
		</div>
	</section>

	<div class="ui-history-grid">
		<HistoryKhatm title={m.history_created()}>
			{#snippet fallback()}
				<div class="ui-history-empty">{m.history_created_empty()}</div>
			{/snippet}
		</HistoryKhatm>

		<HistoryZekr title={m.history_zekr()}>
			{#snippet fallback()}
				<div class="ui-history-empty">{m.history_zekr_empty()}</div>
			{/snippet}
		</HistoryZekr>

		<HistoryPickedRange title={m.history_picked()}>
			{#snippet fallback()}
				<div class="ui-history-empty">{m.history_picked_empty()}</div>
			{/snippet}
		</HistoryPickedRange>
	</div>
</div>
