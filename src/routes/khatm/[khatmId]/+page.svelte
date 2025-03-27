<script lang="ts">
	import type { PageProps } from './$types'
	import SelectPartList from './select-part.svelte'
	import SelectPartWizard from './wizard.svelte'
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import { invalidateAll } from '$app/navigation'
	import Header from '$lib/components/Header.svelte'
	import IconViewWizard from '~icons/ic/twotone-view-carousel'
	import IconViewList from '~icons/ic/outline-view-agenda'
	import IconViewTable from '~icons/ic/round-calendar-view-month'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import AyahByAyah from './ayah-by-ayah.svelte'

	const { data }: PageProps = $props()

	let layout = $state<'wizard' | 'list' | 'grid'>('wizard')
	const CurrentLayoutIcon = $derived(
		{
			wizard: IconViewWizard,
			list: IconViewList,
			grid: IconViewTable,
		}[layout],
	)

	const SelectPart = $derived(layout === 'wizard' ? SelectPartWizard : SelectPartList)

	$effect(() => {
		console.log('raw parts', data.khatm.parts)
	})

	const khatm = $derived(data.khatm)

	const parts = $derived(KhatmPart.fromList(khatm.parts))

	const count = $derived(
		khatm.sequential
			? khatm.currentAyahIndex
			: parts.map((p) => p.length).reduce((a, b) => a + b, 0),
	)

	const percentSequential = $derived(
		Math.floor((100_00 * khatm.currentAyahIndex) / COUNT_OF_AYAHS) / 100,
	)
	const percentNonSequential = $derived(Math.floor((100_00 * count) / COUNT_OF_AYAHS) / 100)
	const percent = $derived(khatm.sequential ? percentSequential : percentNonSequential)

	const canSelectLayout = $derived(percent < 100 && !khatm.sequential)
</script>

<svelte:head>
	<title>ختم قرآن | {khatm.title}</title>
	<meta name="description" content={khatm.description} />
</svelte:head>

<Header title="ختم قرآن گروهی">
	{#snippet start()}
		<div class="flex-none">
			<ul class="menu menu-horizontal px-1">
				<!-- <li><a><CurrentLayoutIcon /></a></li> -->
				{#if canSelectLayout}
					<li>
						<details>
							<summary><CurrentLayoutIcon /></summary>
							<ul class="bg-base-100 rounded-t-none p-2">
								<li>
									<button onclick={() => (layout = 'wizard')}>
										<IconViewWizard />
										مرحله‌ای
									</button>
								</li>
								<li>
									<button onclick={() => (layout = 'list')}>
										<IconViewList />
										لیستی
									</button>
								</li>
								<li>
									<button onclick={() => (layout = 'grid')}>
										<IconViewTable />
										جدولی
									</button>
								</li>
							</ul>
						</details>
					</li>
				{/if}
			</ul>
		</div>
	{/snippet}
</Header>

<div class="hero">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<div class="max-w-md">
			<h1 class="text-5xl font-black">
				{khatm.title}
				{#if khatm.rangeType === 'ayah'}
					<span class="badge badge-info">آیه به آیه</span>
				{/if}
			</h1>
			<p class="pt-6 pb-1">
				{khatm.description}
			</p>
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">پیشرفت ختم</div>
					<div class="stat-value px-2">{percent.toLocaleString('fa')}٪</div>
					<div class="stat-desc">
						<progress class="progress progress-success w-23" max={COUNT_OF_AYAHS} value={count}
						></progress>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if percent < 100 && data.khatm.rangeType === 'ayah'}
	<AyahByAyah khatm={data.khatm} />
{:else if percent < 100}
	<SelectPart {parts} khatm={data.khatm} onFinished={invalidateAll} grid={layout === 'grid'} />
{:else}
	<div class="alert alert-success">
		<p>تبریک! این ختم قرآن کامل شده است.</p>
	</div>
{/if}

<div class="pt-10"></div>
