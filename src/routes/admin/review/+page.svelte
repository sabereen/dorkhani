<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import IconPending from '~icons/ic/outline-pending'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconLink from '~icons/ic/round-link'
	import Tab from '$lib/components/Tab.svelte'
	import type { ReviewStatus } from '@prisma-client'
	import { onMount } from 'svelte'
	import { watch } from '$lib/hooks/watch.svelte'

	let khatms = $state<Khatm[]>([])
	let reviewStatus: ReviewStatus = $state('pending')

	let lastPage = $state(false)
	let loading = $state(false)

	async function nextPage() {
		const currentTab = reviewStatus
		loading = true
		try {
			const list = await Khatm.getList({ pageID: khatms.at(-1)?.id, reviewStatus })
			if (currentTab !== reviewStatus) return
			if (list.length === 0) lastPage = true
			khatms = [...khatms, ...list]
		} catch (err) {
			console.error(err)
			alert(err)
		} finally {
			loading = false
		}
	}

	onMount(nextPage)

	function approve(khatm: Khatm) {
		khatm.update({ reviewStatus: 'approved' })
	}
	function reject(khatm: Khatm) {
		khatm.update({ reviewStatus: 'rejected' })
	}

	watch(
		() => reviewStatus,
		() => {
			lastPage = false
			khatms = []
			nextPage()
		},
	)
</script>

<svelte:head>
	<title>ختم قرآن | تأیید و رد</title>
</svelte:head>

<Header title="تأیید و رد ختم ها" />

{#snippet khatmItem(khatm: Khatm)}
	<div class="flex min-w-0 grow basis-0 flex-col">
		<div>
			{khatm.title}
			<span class="ui-badge ui-badge-xs" class:ui-badge-info={khatm.isAyahOriented}>
				{khatm.rangeTypeTitle}
			</span>
		</div>
		<p class="whitespace-pre-wrap text-xs opacity-85">{khatm.description}</p>
	</div>
	<div class="ui-flex-gap-sm flex shrink-0 items-center">
		<span
			class="ui-badge rounded px-2 py-1 text-xs"
			class:bg-green-500={khatm.percent === 100}
			class:opacity-75={khatm.percent !== 100}
		>
			{khatm.percent.toLocaleString('fa')}%
		</span>
		<a class="ui-btn ui-btn-xs ui-btn-square ui-btn-ghost p-0" href={khatm.link} target="_blank">
			<IconLink class="size-5" />
		</a>
		{#if khatm.reviewStatus === 'pending' || khatm.reviewStatus === 'approved'}
			<button
				class="ui-btn ui-btn-xs ui-btn-square ui-btn-ghost p-0"
				onclick={() => reject(khatm)}
			>
				<IconRejected class="size-5 text-red-500" />
			</button>
		{/if}
		{#if khatm.reviewStatus === 'pending' || khatm.reviewStatus === 'rejected'}
			<button
				class="ui-btn ui-btn-xs ui-btn-square ui-btn-ghost p-0"
				onclick={() => approve(khatm)}
			>
				<IconApproved class="size-5 text-green-500" />
			</button>
		{/if}
	</div>
{/snippet}

<div class="ui-bg-muted rounded-b px-2 pb-2 text-sm shadow-sm">
	<Tab
		tabs={[
			{
				slug: 'pending' satisfies ReviewStatus,
				icon: IconPending,
				title: 'منتظر تأیید',
			},
			{
				slug: 'approved' satisfies ReviewStatus,
				icon: IconApproved,
				title: 'تأیید شده',
			},
			{
				slug: 'rejected' satisfies ReviewStatus,
				icon: IconRejected,
				title: 'رد شده',
			},
		]}
		bind:value={reviewStatus}
	/>
</div>

<section class="ui-card ui-card-bordered ui-bg-muted mt-4">
	<div class="ui-card-body">
		<h2 class="ui-card-title">آخرین ختم‌های عمومی</h2>
		<ul class="ui-list">
			{#each khatms as khatm (khatm.id)}
				<li class="ui-list-row w-full">
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
		{#if !lastPage}
			<button class="ui-btn" onclick={nextPage} disabled={loading}> بارگیری موارد بعدی </button>
		{/if}
	</div>
</section>
