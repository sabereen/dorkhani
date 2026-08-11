<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
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

	function getAdminDetailLink(khatm: Khatm) {
		const url = new URL(khatm.link)
		url.searchParams.set('admin', '1')
		return url.toString()
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
	<KhatmListCard
		{khatm}
		meta={khatm.reviewStatus === 'approved'
			? 'تأییدشده'
			: khatm.reviewStatus === 'rejected'
				? 'ردشده'
				: 'منتظر بررسی'}
		showDescription
	>
		{#snippet actions()}
			<a
				class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
				href={getAdminDetailLink(khatm)}
				target="_blank"
				aria-label={`مشاهده ختم ${khatm.title}`}><IconLink /></a
			>
			{#if khatm.reviewStatus === 'pending' || khatm.reviewStatus === 'approved'}
				<button
					class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
					type="button"
					aria-label="رد کردن ختم"
					onclick={() => reject(khatm)}
				>
					<IconRejected class="text-red-500" />
				</button>
			{/if}
			{#if khatm.reviewStatus === 'pending' || khatm.reviewStatus === 'rejected'}
				<button
					class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
					type="button"
					aria-label="تأیید ختم"
					onclick={() => approve(khatm)}
				>
					<IconApproved class="text-green-500" />
				</button>
			{/if}
		{/snippet}
	</KhatmListCard>
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
		<ul class="ui-khatm-card-list">
			{#each khatms as khatm (khatm.id)}
				<li>
					{@render khatmItem(khatm)}
				</li>
			{/each}
		</ul>
		{#if !lastPage}
			<button class="ui-btn" onclick={nextPage} disabled={loading}> بارگیری موارد بعدی </button>
		{/if}
	</div>
</section>
