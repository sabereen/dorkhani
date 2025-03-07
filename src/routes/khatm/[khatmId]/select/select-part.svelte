<script lang="ts" module>
	import type { KhatmPart as IKhatmPart } from '@prisma/client'
	export type Props = {
		parts: IKhatmPart[]
	}
</script>

<script lang="ts">
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import { Surah, Page, Ayah } from '@ghoran/entity'
	import { juzList } from '@ghoran/metadata'
	import { COUNT_OF_PAGES, COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	const props: Props = $props()

	console.log(props.parts)

	const surahList = Surah.getAll()

	const pageList = new Array(COUNT_OF_PAGES).fill(0).map((_, i) => Page.get(i))
</script>

<div class="relative h-[15000px]">
	<div class="absolute inset-y-0 w-full bg-gray-500"></div>

	{#each props.parts as plainPart}
		{@const part = new KhatmPart(plainPart)}
		{@const style = part.getStyle()}
		<div
			class="absolute w-full bg-green-500"
			style:height={style.width}
			style:top={style.start}
		></div>
	{/each}

	<div class="text-xs">
		{#each surahList as surah}
			<div
				class="absolute w-1/3 overflow-hidden border border-blue-200"
				style:height={surah.ayahCount / 62.36 + '%'}
				style:top={surah.firstAyahIndex / 62.36 + '%'}
			>
				{surah.name}
			</div>
		{/each}
	</div>

	<div>
		{#each juzList as juz, index}
			{@const ayahCount = (juzList[index + 1] || 6236) - juz}
			<div
				class="absolute right-1/3 w-1/3 border border-blue-200"
				style:height={ayahCount / 62.36 + '%'}
				style:top={juz / 62.36 + '%'}
			>
				جزء {index + 1}
			</div>
		{/each}
	</div>

	<div class="text-xs">
		{#each pageList as page}
			{@const ayahCount = page.lastAyahIndex - page.firstAyahIndex + 1}
			<div
				class="absolute right-2/3 w-1/3 border border-blue-200"
				style:height={ayahCount / 62.36 + '%'}
				style:top={page.firstAyahIndex / 62.36 + '%'}
			>
				صفحه {page.pageNumber}
			</div>
		{/each}
	</div>
</div>
