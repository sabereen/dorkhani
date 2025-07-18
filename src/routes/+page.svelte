<script lang="ts">
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { PageProps } from './$types'
	import HistoryKhatm from './history/history-khatm.svelte'
	import HistoryPickedRange from './history/history-picked-range.svelte'
	import { base } from '$app/paths'
	import { rebaseFullPath } from '$lib/utility/path'
	import Header from '$lib/components/Header.svelte'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import HistoryZekr from './history/history-zekr.svelte'

	const { data }: PageProps = $props()

	const khatms = $derived(Khatm.fromPlainList(data.khatms))
	const zekrList = $derived(Zekr.fromPlainList(data.zekrList))
</script>

<svelte:head>
	<title>ختم قرآن</title>
	<meta
		name="description"
		content="از طریق این سامانه می‌توانید به صورت گروهی ختم قرآن انجام دهید؛ و وضعیت بازه‌های قرائت شده را رصد کنید."
	/>
	<meta property="og:image" content={rebaseFullPath('/hero.png')} />
</svelte:head>

<Header>
	{#snippet start()}
		<p class="ws-nowrap select-none ps-4 text-xl font-black">سامانه ختم جمعی قرآن</p>
	{/snippet}
</Header>

<div class="hero mt-7">
	<div class="hero-content flex flex-col text-center sm:flex-row">
		<img
			src={`${base}/hero.png`}
			class="max-w-50 h-auto rounded-lg shadow-2xl"
			width="250"
			height="250"
			alt="logo"
		/>
		<div class="max-w-md">
			<h1 class="text-5xl font-black">ختم قرآن</h1>
			<p class="py-6">
				از طریق این سامانه می‌توانید به صورت گروهی ختم قرآن انجام دهید؛ و وضعیت بازه‌های قرائت شده
				را رصد کنید.
			</p>
			<a class="btn btn-primary font-bold" href={`${base}/add`}>ایجاد ختم قرآن جدید</a>
			<a class="btn btn-outline font-bold" href={`${base}/add?rangeType=ayah`}>
				ایجاد ختم آیه به آیه
			</a>
		</div>
	</div>
</div>

<div class="grid grid-cols-1 gap-3">
	<HistoryKhatm limit={3} title="آخرین ختم‌های قرآن که ایجاد کرده اید" />
	<HistoryZekr limit={3} title="آخرین ختم‌های ذکر که ایجاد کرده اید" />
	<HistoryPickedRange limit={3} title="آخرین مشارکت‌های شما" />
</div>

{#if khatms.length}
	<section class="card card-border bg-base-200 mt-4">
		<div class="card-body">
			<h2 class="card-title">برخی از آخرین ختم‌های قرآن</h2>
			<ul class="list">
				{#each khatms as khatm}
					<li class="">
						<a
							class="list-row clear-both !block !flex w-full hover:bg-green-500/15"
							href={khatm.link}
						>
							<!-- Title & Badge -->
							<span class="min-w-0 grow">
								{khatm.title}
								{#if !khatm.isFree}
									<span class="badge badge-xs" class:badge-info={khatm.isAyahOriented}>
										{khatm.rangeTypeTitle}
									</span>
								{/if}
							</span>
							<!-- Percent -->
							<span class="flex shrink-0 flex-col items-end">
								<span class="-mt-1 px-0.5 text-[13px]">
									{khatm.percent.toLocaleString('fa')}%
								</span>
								<progress
									class="progress progress-success h-1.5 w-10"
									max={100}
									value={khatm.percent}
								></progress>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}

{#if zekrList.length}
	<section class="card card-border bg-base-200 mt-4">
		<div class="card-body">
			<h2 class="card-title">آخرین ختم‌های اذکار</h2>
			<ul class="list">
				{#each zekrList as zekr}
					<li class="">
						<a
							class="list-row clear-both !block !flex w-full hover:bg-green-500/15"
							href={zekr.link}
						>
							<!-- Title & Badge -->
							<span class="min-w-0 grow">
								{zekr.title}
								{#if zekr.isFinite}
									<span class="badge badge-info badge-xs">{zekr.targetCount} تایی</span>
								{/if}
							</span>
							<!-- Stats -->
							<span class="flex shrink-0 flex-col items-end">
								<span class="-mt-1 px-0.5 text-[13px]">
									{zekr.count.toLocaleString('fa')} عدد
								</span>
								{#if zekr.isFinite}
									<progress
										class="progress progress-success h-1.5 w-10"
										max={100}
										value={zekr.percent}
									></progress>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}
