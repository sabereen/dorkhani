<script lang="ts">
	import type { PageProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconShare from '~icons/ic/outline-share'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconAutoAwesome from '~icons/ic/round-auto-awesome'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconGroups from '~icons/ic/round-groups'
	import IconInfinite from '~icons/ic/round-all-inclusive'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { browser } from '$app/environment'
	import { page } from '$app/state'
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
	const remainingCount = $derived(Math.max(zekr.targetCount - zekr.count, 0))
</script>

<PageTitle title={zekr.title} />

<svelte:head>
	<meta name="description" content={zekr.description} />
	<meta property="og:title" content={`${zekr.title} | ${page.data.branding.name}`} />
	<meta property="og:description" content={zekr.description} />
	<meta property="og:logo" content={new URL(page.data.branding.icon512Url, page.url.origin).href} />
	<meta property="og:image" content={new URL(page.data.branding.icon512Url, page.url.origin).href} />
	<meta property="og:url" content={zekr.link} />
	<meta property="og:type" content="website" />
</svelte:head>

<Header title={zekr.title}>
	{#snippet end()}
		{#if canShare}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={share}
				aria-label="اشتراک‌گذاری"
			>
				<IconShare class="size-5" />
				<span>اشتراک‌گذاری</span>
			</button>
		{:else}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={copy}
				aria-label="کپی لینک"
			>
				<IconCopy class="size-5" />
				<span>کپی لینک</span>
			</button>
		{/if}
	{/snippet}
</Header>

<main class="ui-container-reading ui-page ui-zekr-page">
	<section class="ui-zekr-overview" aria-labelledby="zekr-title">
		<span class="ui-zekr-orb ui-zekr-orb-one" aria-hidden="true"></span>
		<span class="ui-zekr-orb ui-zekr-orb-two" aria-hidden="true"></span>

		<div class="ui-zekr-overview-copy">
			<div class="ui-zekr-kicker">
				<IconAutoAwesome />
				<span>ختم ذکر گروهی</span>
			</div>

			<h1 id="zekr-title">{zekr.title}</h1>

			<div class="ui-zekr-statuses">
				{#if zekr.finished}
					<span class="ui-badge ui-badge-success">
						<IconCheck />
						<span>هدف این ختم کامل شده است</span>
					</span>
				{:else if zekr.isFinite}
					<span class="ui-badge ui-badge-info">
						هدف: {zekr.targetCount.toLocaleString('fa')} مرتبه
					</span>
				{:else}
					<span class="ui-badge ui-badge-accent">
						<IconInfinite />
						<span>بدون محدودیت تعداد</span>
					</span>
				{/if}
			</div>

			{#if zekr.description}
				<div dir="auto" class="ui-zekr-description">
					<ExpandableText text={zekr.description} maxLength={250} threshold={10} />
				</div>
			{/if}
		</div>

		<div class="ui-zekr-progress-card">
			<div class="ui-zekr-progress-heading">
				<span class="ui-zekr-progress-icon"><IconGroups /></span>
				<div>
					<span>مشارکت جمعی</span>
					<strong>{zekr.count.toLocaleString('fa')}</strong>
					<small>مرتبه ذکر گفته شده</small>
				</div>
			</div>

			{#if zekr.isFinite}
				<div class="ui-zekr-progress-details">
					<div class="ui-zekr-progress-labels">
						<span>{percent.toLocaleString('fa')}٪ پیشرفت</span>
						{#if zekr.finished}
							<span>هدف تکمیل شده</span>
						{:else}
							<span>{remainingCount.toLocaleString('fa')} مرتبه تا هدف</span>
						{/if}
					</div>
					<progress
						class="ui-progress ui-progress-success"
						max={100}
						value={percent}
						aria-label={`پیشرفت ختم: ${percent.toLocaleString('fa')} درصد`}
					></progress>
					<div class="ui-zekr-progress-scale">
						<span>شروع</span>
						<span>هدف {zekr.targetCount.toLocaleString('fa')}</span>
					</div>
				</div>
			{:else}
				<p class="ui-zekr-open-message">
					این ختم سقف مشخصی ندارد؛ هر بار مشارکت شما به این همراهی جمعی اضافه می‌شود.
				</p>
			{/if}

			<div class="ui-zekr-personal-slot" aria-live="polite">
				{#if myCount}
					<div class="ui-zekr-personal" transition:slide={{ axis: 'y' }}>
						<span class="ui-zekr-personal-icon"><IconCheck /></span>
						<div>
							<span>سهم شما در این ختم</span>
							<strong>{myCount.toLocaleString('fa')} مرتبه</strong>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<ZekrActions {zekr} bind:myCount />

	{#if zekr.zekrText}
		<section class="ui-zekr-text-card" aria-labelledby="zekr-text-title">
			<div class="ui-zekr-section-heading">
				<span><IconAutoAwesome /></span>
				<div>
					<small>متن برای خواندن</small>
					<h2 id="zekr-text-title">ذکر این ختم</h2>
				</div>
			</div>
			<div dir="auto" class="ui-zekr-text">{zekr.zekrText}</div>
		</section>
	{/if}
</main>
