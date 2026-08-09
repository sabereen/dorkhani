<script lang="ts">
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { PageProps } from './$types'
	import HistoryKhatm from './history/history-khatm.svelte'
	import HistoryPickedRange from './history/history-picked-range.svelte'
	import { base } from '$app/paths'
	import { rebaseFullPath } from '$lib/utility/path'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import HistoryZekr from './history/history-zekr.svelte'

	import IconMore from '~icons/ic/outline-read-more'

	const { data }: PageProps = $props()

	const khatms = $derived(Khatm.fromPlainList(data.khatms))
	const showcase = $derived(Khatm.fromPlainList(data.showcase))
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

<div class="ui-hero">
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
			<a class="ui-btn ui-btn-primary" href={`${base}/add`}>ایجاد ختم قرآن جدید</a>
		</div>
</div>

<div class="ui-page-grid ui-page-grid-three">
	<HistoryKhatm limit={3} title="آخرین ختم‌های قرآن که ایجاد کرده اید" />
	<HistoryZekr limit={3} title="آخرین ختم‌های ذکر که ایجاد کرده اید" />
	<HistoryPickedRange limit={3} title="آخرین مشارکت‌های شما" />
</div>

{#snippet khatmList(khatms: Khatm[], title: string, moreLink?: string)}
	<section class="ui-card ui-card-bordered ui-bg-muted mt-4">
		<div class="ui-card-body">
			<h2 class="ui-card-title flex items-center justify-between">
				{title}
				{#if moreLink}
					<a href={moreLink} class="ui-btn ui-btn-ghost">
						موارد بیشتر
						<IconMore class="size-6 -scale-x-100" />
					</a>
				{/if}
			</h2>
			<ul class="ui-list">
				{#each khatms as khatm}
					<li class="">
						<a
							class="ui-list-row"
							href={khatm.link}
						>
							<!-- Title & Badge -->
							<span class="min-w-0 grow">
								{khatm.title}
								{#if !khatm.isFree}
									<span class="ui-badge ui-badge-xs" class:ui-badge-info={khatm.isAyahOriented}>
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
									class="ui-progress ui-progress-success h-1.5 w-10"
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
{/snippet}

{#if showcase.length > 0}
	{@render khatmList(showcase, 'ختم‌های برگزیده')}
{/if}
{#if khatms.length > 0}
	{@render khatmList(khatms, 'ختم‌های تأییدشده', `${base}/list`)}
{/if}

{#if zekrList.length}
	<section class="ui-card ui-card-bordered ui-bg-muted mt-4">
		<div class="ui-card-body">
			<h2 class="ui-card-title">آخرین ختم‌های اذکار</h2>
			<ul class="ui-list">
				{#each zekrList as zekr}
					<li class="">
						<a
							class="ui-list-row"
							href={zekr.link}
						>
							<!-- Title & Badge -->
							<span class="min-w-0 grow">
								{zekr.title}
								{#if zekr.isFinite}
									<span class="ui-badge ui-badge-info ui-badge-xs">{zekr.targetCount} تایی</span>
								{/if}
							</span>
							<!-- Stats -->
							<span class="flex shrink-0 flex-col items-end">
								<span class="-mt-1 px-0.5 text-[13px]">
									{zekr.count.toLocaleString('fa')} عدد
								</span>
								{#if zekr.isFinite}
									<progress
										class="ui-progress ui-progress-success h-1.5 w-10"
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
