<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { PageProps } from './$types'
	import IconPending from '~icons/ic/outline-pending'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconLink from '~icons/ic/round-link'
	import { fly, slide } from 'svelte/transition'
	import { flip } from 'svelte/animate'
	import Tab from '$lib/components/Tab.svelte'
	import type { ReviewStatus } from '@prisma/client'

	const { data }: PageProps = $props()

	const khatms = $derived(Khatm.fromPlainList(data.list))

	let reviewStatus: ReviewStatus = $state('pending')

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
<!-- 
<section class="card card-border bg-base-200 mt-4">
	<div class="card-body">
		<h2 class="card-title">ختم‌های صفحه اصلی</h2>

		<label class="bg-base-100 mt-2 flex cursor-pointer items-center rounded-lg px-2 py-1 py-2">
			<input class="checkbox" type="checkbox" name="autoShowcase" bind:checked={autoShowcase} />
			<span class="ms-2 flex min-w-0 grow basis-0 flex-col">
				<span class="text-[.9rem] font-bold">ویترین خودکار</span>
				<p class="text-xs">
					بدون نیاز به تأیید مدیر آخرین ختم‌های عمومی در صفحه اصلی نمایش داده شوند.
				</p>
			</span>
		</label>

		{#if !autoShowcase}
			<ul class="list" in:fly={{ y: 50 }}>
				{#each showcase as khatm (khatm.id)}
					<li
						animate:flip={{ duration: 300 }}
						transition:fly={{ x: 20 }}
						class="list-row !flex w-full"
					>
						{@render khatmItem(khatm)}
					</li>
				{/each}
			</ul>
		{/if}

		<div class="card-actions justify-end">
			<button disabled={!isDirty} class="btn btn-primary" onclick={save}>
				{#if loading}
					<span transition:slide={{ axis: 'x' }} class="loading block"></span>
				{/if}
				ذخیره تغییرات
			</button>
		</div>
	</div>
</section> -->

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
		<button disabled class="btn">بارگیری موارد بعدی</button>
	</div>
</section>
