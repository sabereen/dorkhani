<script lang="ts">
	import type { PageProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import IconViewWizard from '~icons/ic/twotone-view-carousel'
	import IconViewList from '~icons/ic/outline-view-agenda'
	import IconViewTable from '~icons/ic/round-calendar-view-month'
	import IconShare from '~icons/ic/outline-share'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import AyahByAyah from './ayah-by-ayah.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import GridLayout from './grid-layout.svelte'
	import ListLayout from './list-layout.svelte'
	import WizardLayout from './wizard-layout.svelte'
	import { page } from '$app/state'
	import { toast } from '$lib/components/TheToast.svelte'

	const { data }: PageProps = $props()

	let layout = $state<'wizard' | 'list' | 'grid'>('wizard')
	const CurrentLayoutIcon = $derived(
		{
			wizard: IconViewWizard,
			list: IconViewList,
			grid: IconViewTable,
		}[layout],
	)

	const SelectPart = $derived(
		{
			wizard: WizardLayout,
			grid: GridLayout,
			list: ListLayout,
		}[layout],
	)

	const khatm = $derived(Khatm.fromPlain(data.khatm))

	const parts = $derived(khatm.getKhatmParts())

	async function share() {
		try {
			await khatm.share()
		} catch (err) {
			console.error(err)
			toast('error', String(err))
		}
	}

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

	const canSelectLayout = $derived(percent < 100 && !khatm.sequential && khatm.rangeType === 'free')
</script>

<svelte:head>
	<title>ختم قرآن | {khatm.title}</title>
	<meta name="description" content={khatm.description} />
	<meta property="og:title" content="ختم قرآن | {khatm.title}" />
	<meta property="og:description" content={khatm.description} />
	<meta property="og:logo" content="https://khatm.esangar.ir/hero.png" />
	<meta property="og:image" content="https://khatm.esangar.ir/hero.png" />
	<meta property="og:url" content={khatm.link} />
	<meta property="og:type" content="website" />
	{#if khatm.private}
		<meta name="robots" content="noindex" />
	{/if}
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
							<ul class="bg-base-200 rounded-t-none p-2">
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

	{#snippet end()}
		<button class="btn btn-square btn-xs btn-soft" onclick={share} aria-label="Share">
			<IconShare class="size-5" />
		</button>
	{/snippet}
</Header>

<div class="hero">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<div class="max-w-md">
			<h1 class="text-3xl font-black break-words">
				{khatm.title}
				{#if khatm.rangeType === 'ayah'}
					<span class="badge badge-info">آیه به آیه</span>
				{/if}
			</h1>
			<div class="pt-5 pb-1 break-words">
				{#each khatm.description?.split('\n') as line}
					<p dir="auto" class="mt-1">{line}</p>
				{/each}
			</div>
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

{#if percent >= 100}
	<div class="alert alert-success">
		<p>این ختم قرآن کامل شده است.</p>
	</div>
{:else if data.khatm.rangeType === 'ayah'}
	<AyahByAyah {khatm} />
{:else}
	<SelectPart {parts} {khatm} onFinished={() => khatm.refresh()} grid={layout === 'grid'} />
{/if}

<div class="pt-10"></div>
