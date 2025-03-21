<script lang="ts">
	import type { PageProps } from './$types'
	import SelectPart from './select-part.svelte'
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import { invalidateAll } from '$app/navigation'
	const { data }: PageProps = $props()

	const parts = $derived(KhatmPart.fromList(data.khatm.parts))

	const count = $derived(parts.map((p) => p.length).reduce((a, b) => a + b, 0))

	const percent = $derived(Math.floor((100_00 * count) / 6236) / 100)
</script>

<svelte:head>
	<title>ختم قرآن | {data.khatm.title}</title>
	<meta name="description" content={data.khatm.description} />
</svelte:head>

<h1 class="mb-5 text-3xl">جزئیات ختم «{data.khatm.title}»</h1>

<p>{data.khatm.description}</p>

<div class="alert m-2 flex flex-col">
	پیشرفت کل: {percent}درصد
	<progress max={6236} value={count}></progress>
</div>

<div class="alert alert-info m-2">
	برای قبول کردن و خواندن بخشی از ختم روی بازه مورد نظر کلیک کنید.
</div>

<p class="text-sm">بخش سبزرنگ قسمتی را نشان می‌دهد که تا الآن خوانده شده است</p>

<SelectPart {parts} onFinished={invalidateAll} />
