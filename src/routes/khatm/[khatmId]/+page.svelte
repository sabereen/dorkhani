<script lang="ts">
	import type { PageProps } from './$types'
	import SelectPart from './select-part.svelte'
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import { invalidateAll } from '$app/navigation'
	import Header from '$lib/components/Header.svelte'
	const { data }: PageProps = $props()

	$effect(() => {
		console.log('raw parts', data.khatm.parts)
	})

	const parts = $derived(KhatmPart.fromList(data.khatm.parts))

	const count = $derived(parts.map((p) => p.length).reduce((a, b) => a + b, 0))

	const percent = $derived(Math.floor((100_00 * count) / 6236) / 100)
</script>

<svelte:head>
	<title>ختم قرآن | {data.khatm.title}</title>
	<meta name="description" content={data.khatm.description} />
</svelte:head>

<Header title="ختم قرآن گروهی" />

<div class="hero">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<div class="max-w-md">
			<h1 class="text-5xl font-black">{data.khatm.title}</h1>
			<p class="pt-6 pb-1">
				{data.khatm.description}
			</p>
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">پیشرفت ختم</div>
					<div class="stat-value px-2">{percent}%</div>
					<div class="stat-desc">
						<progress class="progress progress-success" max={6236} value={count}></progress>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<SelectPart {parts} onFinished={invalidateAll} />
