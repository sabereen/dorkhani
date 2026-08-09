<script lang="ts">
	import type { PageProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import IconShare from '~icons/ic/outline-share'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconSettings from '~icons/ic/round-settings'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { browser } from '$app/environment'
	import { base } from '$app/paths'
	import { rebaseFullPath } from '$lib/utility/path'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import ZekrActions from './ZekrActions.svelte'
	import { idb_localZekr_get } from '$lib/idb/localZekr'
	import { slide } from 'svelte/transition'

	const { data }: PageProps = $props()

	const canShare = !browser || navigator.share

	const zekr = $derived(Zekr.fromPlain(data.zekr))

	let myCount = $state(0)
	$effect(() => {
		idb_localZekr_get(zekr.id).then((result) => {
			myCount = result?.myCount || 0
		})
	})

	function share() {
		zekr.share()
	}

	async function copy() {
		try {
			await zekr.copy()
			toast('info', 'لینک ختم ذکر شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'خطا در کپی.')
		}
	}

	const percent = $derived(zekr.percent)
</script>

<svelte:head>
	<title>ختم اذکار | {zekr.title}</title>
	<meta name="description" content={zekr.description} />
	<meta property="og:title" content="ختم اذکار | {zekr.title}" />
	<meta property="og:description" content={zekr.description} />
	<meta property="og:logo" content={rebaseFullPath('/hero.png')} />
	<meta property="og:image" content={rebaseFullPath('/hero.png')} />
	<meta property="og:url" content={zekr.link} />
	<meta property="og:type" content="website" />
	<!-- {#if khatm.private}
		<meta name="robots" content="noindex" />
	{/if} -->
</svelte:head>

<Header title="ختم اذکار گروهی" link={`${base}/`}>
	{#snippet end()}
		<a href={`${base}/settings`} class="ui-btn ui-btn-icon ui-btn-ghost" aria-label="تنظیمات">
			<IconSettings class="size-5" />
		</a>

		{#if canShare}
			<button type="button" class="ui-btn ui-btn-icon ui-btn-ghost" onclick={share} aria-label="اشتراک‌گذاری">
				<IconShare class="size-5" />
			</button>
		{:else}
			<button type="button" class="ui-btn ui-btn-icon ui-btn-ghost" onclick={copy} aria-label="کپی لینک">
				<IconCopy class="size-5" />
			</button>
		{/if}
	{/snippet}
</Header>

<div class="ui-container-reading">
<div class="ui-hero !min-h-0">
		<div class="w-full max-w-md">
			<h1 class="break-words text-2xl font-black">
				{zekr.title}
				{#if zekr.isFinite}
					<span class="ui-badge ui-badge-info">{zekr.targetCount} مرتبه</span>
				{/if}
			</h1>

			{#if zekr.finished}
				<div class="mt-2">
					<div class="ui-badge ui-badge-success m-auto">این ختم به هدف خود رسیده است.</div>
				</div>
			{/if}

			{#if zekr.description}
				<div dir="auto" class="self-center break-words pb-1 pt-5 text-start">
					<ExpandableText text={zekr.description} maxLength={250} threshold={10} />
				</div>
			{/if}

			<div class="ui-stats -mb-2">
				<div class="ui-stat">
					<div class="ui-stat-title">میزان مشارکت</div>
					<div class="ui-stat-value h-auto px-2">
						<span class="text-6xl">{zekr.count.toLocaleString('fa')}</span>
						{#if zekr.isFinite}
							<span class="ui-badge ui-badge-info">{percent.toLocaleString('fa')}٪</span>
						{/if}
					</div>
					{#if zekr.isFinite}
						<div class="ui-stat-description">
							<progress class="ui-progress ui-progress-success w-23" max={100} value={percent}></progress>
						</div>
					{/if}
				</div>
			</div>

			{#if myCount}
				<p class="text-xs" transition:slide={{ axis: 'y' }}>
				از این تعداد <span class="ui-badge ui-badge-accent">{myCount} عدد</span> را شما تقبل کرده اید.
				</p>
			{/if}
		</div>
</div>

<ZekrActions {zekr} bind:myCount />

{#if zekr.zekrText}
	<div
		dir="auto"
		class="ws-pre-wrap w-full break-words px-4 pb-1 pt-5 text-start text-xl leading-9"
	>
		{zekr.zekrText}
	</div>
{/if}

<div class="pt-10"></div>
</div>
