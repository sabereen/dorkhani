<script lang="ts">
	import { formatPercent, localeTag } from '$lib/i18n/format'
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
	import * as m from '$lib/paraglide/messages.js'
	import SeoHead from '$lib/components/SeoHead.svelte'

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
			toast('info', m.zekr_share_copied())
		} catch (err) {
			console.error(err)
			toast('error', m.common_copy_error())
		}
	}

	const percent = $derived(zekr.percent)
	const remainingCount = $derived(Math.max(zekr.targetCount - zekr.count, 0))
</script>

<PageTitle title={zekr.title} emitHead={false} />

<SeoHead
	meta={{
		title: `${zekr.title} | ${page.data.branding.name}`,
		description: zekr.description || page.data.branding.seoDescription,
		canonicalPath: page.url.pathname,
		imagePath: `/og/zekr/${zekr.id}.png?l=${page.data.locale}&v=${zekr.count}-${zekr.targetCount}`,
		imageAlt: zekr.title,
		locale: page.data.locale,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'CreativeWork',
			name: zekr.title,
			description: zekr.description || page.data.branding.seoDescription,
			url: zekr.publicLink,
			dateCreated: zekr.plain.created,
			isAccessibleForFree: true,
			inLanguage: page.data.locale,
		},
	}}
/>

<Header title={zekr.title}>
	{#snippet end()}
		{#if canShare}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={share}
				aria-label={m.common_share()}
			>
				<IconShare class="size-5" />
				<span>{m.common_share()}</span>
			</button>
		{:else}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={copy}
				aria-label={m.common_copy_link()}
			>
				<IconCopy class="size-5" />
				<span>{m.common_copy_link()}</span>
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
				<span>{m.zekr_group_title()}</span>
			</div>

			<h1 id="zekr-title">{zekr.title}</h1>

			<div class="ui-zekr-statuses">
				{#if zekr.finished}
					<span class="ui-badge ui-badge-success">
						<IconCheck />
						<span>{m.zekr_goal_completed()}</span>
					</span>
				{:else if zekr.isFinite}
					<span class="ui-badge ui-badge-info">
						{m.zekr_target({ count: zekr.targetCount.toLocaleString(localeTag()) })}
					</span>
				{:else}
					<span class="ui-badge ui-badge-accent">
						<IconInfinite />
						<span>{m.zekr_unlimited()}</span>
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
					<span>{m.zekr_collective()}</span>
					<strong>{zekr.count.toLocaleString(localeTag())}</strong>
					<small>{m.zekr_repetitions()}</small>
				</div>
			</div>

			{#if zekr.isFinite}
				<div class="ui-zekr-progress-details">
					<div class="ui-zekr-progress-labels">
						<span>{m.zekr_progress({ percent: formatPercent(percent) })}</span>
						{#if zekr.finished}
							<span>{m.zekr_target_completed()}</span>
						{:else}
							<span>{m.zekr_remaining({ count: remainingCount.toLocaleString(localeTag()) })}</span>
						{/if}
					</div>
					<progress
						class="ui-progress ui-progress-success"
						max={100}
						value={percent}
						aria-label={m.zekr_progress({ percent: percent.toLocaleString(localeTag()) })}
					></progress>
					<div class="ui-zekr-progress-scale">
						<span>{m.zekr_start()}</span>
						<span>{m.zekr_goal({ count: zekr.targetCount.toLocaleString(localeTag()) })}</span>
					</div>
				</div>
			{:else}
				<p class="ui-zekr-open-message">
				{m.zekr_open_message()}
				</p>
			{/if}

			<div class="ui-zekr-personal-slot" aria-live="polite">
				{#if myCount}
					<div class="ui-zekr-personal" transition:slide={{ axis: 'y' }}>
						<span class="ui-zekr-personal-icon"><IconCheck /></span>
						<div>
						<span>{m.zekr_your_share()}</span>
						<strong>{m.zekr_registered_count({ count: myCount.toLocaleString(localeTag()) })}</strong>
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
					<small>{m.zekr_reading_text()}</small>
					<h2 id="zekr-text-title">{m.zekr_this_text()}</h2>
				</div>
			</div>
			<div dir="auto" class="ui-zekr-text">{zekr.zekrText}</div>
		</section>
	{/if}
</main>
