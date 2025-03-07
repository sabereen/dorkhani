<script lang="ts">
	import type { PageProps } from './$types'
	import SelectPart from './select/select-part.svelte'
	import { KhatmPart } from '$lib/entity/KhatmPart'

	const { data }: PageProps = $props()

	const count = $derived(
		data.khatm.parts.map((p) => new KhatmPart(p).length).reduce((a, b) => a + b, 0),
	)

	const percent = $derived(Math.floor((100_00 * count) / 6236) / 100)
</script>

<h1 class="mb-5 text-3xl">جزئیات ختم «{data.khatm.title}»</h1>

<p>{data.khatm.description}</p>

<div class="alert m-2 flex flex-col">
	پیشرفت کل: {percent}درصد
	<progress max={6236} value={count}></progress>
</div>

<div class="alert alert-info m-2">
	برای قبول کردن و خواندن بخشی از ختم روی بازه مورد نظر کلیک کنید.
</div>

<SelectPart parts={data.khatm.parts} />
