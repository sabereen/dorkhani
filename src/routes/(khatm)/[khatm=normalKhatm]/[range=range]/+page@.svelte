<script lang="ts">
	import type { PageProps } from './$types'
	import MultipleAyah from '$lib/components/Quran/MultipleAyah.svelte'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { QuranRange } from '$lib/entity/Range'
	import { page } from '$app/state'
	import IconNextPlan from '~icons/ic/outline-next-plan'
	import IconBook from '~icons/ic/round-menu-book'
	import IconDone from '~icons/ic/round-check-circle'

	const { data }: PageProps = $props()
	const range = $derived(QuranRange.fromRangeParam(data.rangeParam)!)
	const khatmUrl = $derived(page.url.href.replace('/' + data.rangeParam, ''))
</script>

<PageTitle title={range.getTitle()} />

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header title={range.getTitle()} />

<main class="ui-container-reading ui-khatm-reading-shell">
	<div class="ui-khatm-reading-marker"><IconBook /><span>آغاز {range.getTitle()}</span></div>
	<section class="ui-khatm-panel">
		<MultipleAyah ayahInfoList={data.ayat} />
	</section>
	<div class="ui-khatm-reading-marker"><IconDone /><span>پایان {range.getTitle()}</span></div>
	<a href={khatmUrl} class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block">
		<IconNextPlan class="size-6" />
		بازگشت به صفحه ختم
	</a>
</main>
