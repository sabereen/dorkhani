<script lang="ts">
	import type { RangeType } from '@prisma-client'
	import ayahIcon from '$lib/icons/ayah.svg?raw'
	import hizbIcon from '$lib/icons/hizb.svg?raw'
	import juzIcon from '$lib/icons/juz.svg?raw'
	import pageIcon from '$lib/icons/page.svg?raw'
	import freeRangeIcon from '$lib/icons/range-free.svg?raw'
	import surahIcon from '$lib/icons/surah.svg?raw'

	type Props = {
		type: RangeType
	}

	let { type }: Props = $props()

	const icons: Record<RangeType, string> = {
		ayah: ayahIcon,
		free: freeRangeIcon,
		hizbQuarter: hizbIcon,
		juz: juzIcon,
		page: pageIcon,
		surah: surahIcon,
	}
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVGs are local static imports. -->
<span class="ui-range-type-icon" aria-hidden="true">{@html icons[type]}</span>

<style>
	.ui-range-type-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: inherit;
	}

	.ui-range-type-icon :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		fill: currentColor;
	}

	.ui-range-type-icon :global(svg[fill='none']) {
		fill: none;
	}
</style>
