<script lang="ts">
	import type { PageProps } from './$types'
	import MultipleAyah from '$lib/components/Quran/MultipleAyah.svelte'
	import Header from '$lib/components/Header.svelte'
	import { QuranRange } from '$lib/entity/Range'
	import { page } from '$app/state'
	import IconNextPlan from '~icons/ic/outline-next-plan'

	const { data }: PageProps = $props()
	const range = $derived(QuranRange.fromRangeParam(data.rangeParam)!)
	const khatmUrl = $derived(page.url.href.replace('/' + data.rangeParam, ''))
</script>

<svelte:head>
	<title>ختم قرآن | {range.getTitle()}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header title={range.getTitle()} />

<p class="alert alert-info mb-1 mt-3 text-lg font-bold">شروع محدوده {range.getTitle()}</p>

<MultipleAyah ayahInfoList={data.ayat} />

<p class="alert alert-info mb-1 mt-3 text-lg font-bold">
	پایان محدوده {range.getTitle()}
</p>
<a href={khatmUrl} class="btn btn-primary btn-lg mt-2 flex grow">
	<IconNextPlan class="size-8" />
	بازگشت به ختم
</a>
