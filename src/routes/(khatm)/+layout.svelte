<script lang="ts">
	import type { LayoutProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import IconViewWizard from '~icons/ic/twotone-view-carousel'
	import IconViewList from '~icons/ic/outline-view-agenda'
	import IconViewTable from '~icons/ic/round-calendar-view-month'
	import IconShare from '~icons/ic/outline-share'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { setKhatmContext } from './khatm-context.svelte'
	import { page } from '$app/state'
	import Tab from '$lib/components/Tab.svelte'

	const { data, children }: LayoutProps = $props()

	let layout = $derived.by<'wizard' | 'list' | 'grid'>(() => {
		if (page.url.pathname.includes('grid')) return 'grid'
		if (page.url.pathname.includes('list')) return 'list'
		return 'wizard'
	})
	const CurrentLayoutIcon = $derived(
		{
			wizard: IconViewWizard,
			list: IconViewList,
			grid: IconViewTable,
		}[layout],
	)

	const khatm = $derived(Khatm.fromPlain(data.khatm))

	const parts = $derived(khatm.getKhatmParts())

	setKhatmContext({
		get khatm() {
			return khatm
		},
		get parts() {
			return parts
		},
	})

	async function share() {
		try {
			await khatm.share()
		} catch (err) {
			console.error(err)
			toast('error', String(err))
		}
	}

	const percent = $derived(khatm.percent)

	const canSelectLayout = $derived(!khatm.finished && khatm.isFree)
</script>

<svelte:head>
	<title>ختم قرآن | {khatm.title}</title>
	<meta name="description" content={khatm.description} />
	<meta property="og:title" content="ختم قرآن | {khatm.title}" />
	<meta property="og:description" content={khatm.description} />
	<meta property="og:logo" content="https://dorkhani.ir/hero.png" />
	<meta property="og:image" content="https://dorkhani.ir/hero.png" />
	<meta property="og:url" content={khatm.link} />
	<meta property="og:type" content="website" />
	{#if khatm.private}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<Header title="ختم قرآن گروهی" link="/">
	{#snippet end()}
		<button
			type="button"
			class="btn !btn-square btn-xs btn-soft"
			onclick={share}
			aria-label="Share"
		>
			<IconShare class="size-5" />
		</button>
	{/snippet}
</Header>

{#if canSelectLayout}
	<div class="bg-base-300 rounded-b px-2 pb-2 text-sm shadow-sm">
		<Tab
			tabs={[
				{ slug: 'wizard', icon: IconViewWizard, title: 'مرحله‌ای', link: khatm.getLink('wizard') },
				{ slug: 'list', icon: IconViewList, title: 'لیستی', link: khatm.getLink('list') },
				{ slug: 'grid', icon: IconViewTable, title: 'جدولی', link: khatm.getLink('grid') },
			]}
			bind:value={() => layout, () => {}}
		/>
	</div>
{/if}

<div class="hero">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<div class="max-w-md">
			<h1 class="break-words text-3xl font-black">
				{khatm.title}
				{#if khatm.rangeType === 'ayah'}
					<span class="badge badge-info">آیه به آیه</span>
				{/if}
			</h1>
			<div class="break-words pb-1 pt-5">
				{#each khatm.description?.split('\n') as line}
					<p dir="auto" class="mt-1 min-h-3">{line}</p>
				{/each}
			</div>
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title">پیشرفت ختم</div>
					<div class="stat-value px-2">{percent.toLocaleString('fa')}٪</div>
					<div class="stat-desc">
						<progress class="progress progress-success w-23" max={100} value={percent}></progress>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

{#if khatm.finished}
	<div class="alert alert-success">
		<p>این ختم قرآن کامل شده است.</p>
	</div>
{:else}
	{@render children()}
{/if}

<div class="pt-10"></div>
