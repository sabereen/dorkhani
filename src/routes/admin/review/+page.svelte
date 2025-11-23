<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import IconPending from '~icons/ic/outline-pending'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconLink from '~icons/ic/round-link'
	import Tab from '$lib/components/Tab.svelte'
	import type { ReviewStatus } from '@prisma/client'
	import { onMount } from 'svelte'

	let khatms = $state<Khatm[]>([])
	let reviewStatus: ReviewStatus = $state('pending')

	let lastPage = $state(false)
	let loading = $state(false)

	async function nextPage() {
		loading = true
		try {
			const list = await Khatm.getList({ pageID: khatms.at(-1)?.id, reviewStatus })
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

	function approve(khatm: Khatm) {}
	function reject(khatm: Khatm) {}
</script>

<svelte:head>
	<title>ختم قرآن | تأیید و رد</title>
</svelte:head>

<Header title="تأیید و رد ختم ها" />

{#snippet khatmItem(khatm: Khatm)}
	<div class="flex min-w-0 grow basis-0 flex-col">
		<div>
			{khatm.title}
			<span class="badge badge-xs" class:badge-info={khatm.isAyahOriented}>
				{khatm.rangeTypeTitle}
			</span>
		</div>
		<p class="whitespace-pre-wrap text-xs opacity-85">{khatm.description}</p>
	</div>
	<div class="flex shrink-0 items-center gap-2">
		<span
			class="badge rounded px-2 py-1 text-xs"
			class:bg-green-500={khatm.percent === 100}
			class:opacity-75={khatm.percent !== 100}
		>
			{khatm.percent.toLocaleString('fa')}%
		</span>
		<a class="btn btn-xs btn-primary btn-square !btn-ghost p-0" href={khatm.link} target="_blank">
			<IconLink class="size-5" />
		</a>
		{#if reviewStatus === 'pending' || reviewStatus === 'approved'}
			<button
				class="btn btn-xs btn-primary btn-square !btn-ghost p-0"
				onclick={() => approve(khatm)}
			>
				<IconRejected class="size-5 text-red-500" />
			</button>
		{/if}
		{#if reviewStatus === 'pending' || reviewStatus === 'rejected'}
			<button
				class="btn btn-xs btn-primary btn-square !btn-ghost p-0"
				onclick={() => reject(khatm)}
			>
				<IconApproved class="size-5 text-green-500" />
			</button>
		{/if}
	</div>
{/snippet}

<div class="bg-base-300 rounded-b px-2 pb-2 text-sm shadow-sm">
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

<section class="card card-border bg-base-200 mt-4">
	<div class="card-body">
		<h2 class="card-title">آخرین ختم‌های عمومی</h2>
		<ul class="list">
			{#each khatms as khatm (khatm.id)}
				<li class="list-row !flex w-full">
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
		{#if !lastPage}
			<button class="btn" onclick={nextPage} disabled={loading}> بارگیری موارد بعدی </button>
		{/if}
	</div>
</section>
