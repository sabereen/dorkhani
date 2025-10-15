<script lang="ts">
	import type { PageProps } from './$types'
	import MultipleAyah from '$lib/components/Quran/MultipleAyah.svelte'
	import Header from '$lib/components/Header.svelte'
	import { QuranRange } from '$lib/entity/Range'

	const { data }: PageProps = $props()
	const range = $derived(QuranRange.fromRangeParam(data.rangeParam)!)
</script>

<Header title={range.getTitle()} />

<MultipleAyah ayahInfoList={data.ayat} />
