<script lang="ts">
	import type { PageProps } from './$types'
	import SelectPartList from './select-part.svelte'
	import SelectPartWizard from './wizard.svelte'
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import { invalidateAll } from '$app/navigation'
	import Header from '$lib/components/Header.svelte'
	import IconViewWizard from '~icons/ic/round-view-carousel'
	import IconViewList from '~icons/ic/baseline-view-list'

	const { data }: PageProps = $props()

	let wizardMode = $state(true)
	const SelectPart = $derived(wizardMode ? SelectPartWizard : SelectPartList)

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

<Header title="ختم قرآن گروهی">
	{#snippet end()}
		<label class="swap">
			<input type="checkbox" bind:checked={wizardMode} />
			<IconViewWizard class="swap-on h-7 w-7" />
			<IconViewList class="swap-off h-7 w-7" />
		</label>
	{/snippet}
</Header>

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

<div class="pt-10"></div>
