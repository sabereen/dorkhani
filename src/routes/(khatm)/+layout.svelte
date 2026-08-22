<script lang="ts">
	import { formatPercent, localeTag } from '$lib/i18n/format'
	import type { LayoutProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconViewWizard from '~icons/ic/twotone-view-carousel'
	import IconViewList from '~icons/ic/outline-view-agenda'
	import IconViewTable from '~icons/ic/round-calendar-view-month'
	import IconShare from '~icons/ic/outline-share'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconEdit from '~icons/ic/round-edit'
	import IconBook from '~icons/ic/round-menu-book'
	import IconPeople from '~icons/ic/round-people-alt'
	import IconLogin from '~icons/ic/round-login'
	import IconPersonAdd from '~icons/ic/round-person-add'
	import IconManageAccounts from '~icons/ic/round-manage-accounts'
	import IconClose from '~icons/ic/round-close'
	import IconStop from '~icons/ic/round-stop-circle'
	import IconAddToHome from '~icons/ic/outline-add-to-home-screen'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import { setKhatmContext } from './khatm-context.svelte'
	import { page } from '$app/state'
	import Tab from '$lib/components/Tab.svelte'
	import { browser } from '$app/environment'
	import { base } from '$app/paths'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { invalidateAll } from '$app/navigation'
	import { idb_createdKhatm_hasClaim } from '$lib/idb/createdKhatm'
	import KhatmParticipation from './KhatmParticipation.svelte'
	import KhatmReviewBar from './KhatmReviewBar.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import { apiRequest } from '$lib/utility/request'
	import { onMount } from 'svelte'
	import { isKhatmShortcutSupported, pinKhatmShortcut } from '$lib/native/khatm-shortcuts'
	import * as m from '$lib/paraglide/messages.js'

	const { data, children }: LayoutProps = $props()

	const canShare = !browser || navigator.share

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
	const rawParts = $derived(khatm.getKhatmParts(false))

	setKhatmContext({
		get khatm() {
			return khatm
		},
		get parts() {
			return parts
		},
		get rawParts() {
			return rawParts
		},
	})

	$effect(() => {
		if (khatm.id > 0 || khatm.seriesId != null) {
			void khatm.participation.load()
		}
	})

	function share() {
		khatm.share()
	}

	async function copy() {
		try {
			await khatm.copy()
			toast('info', m.khatm_copy_success())
		} catch (err) {
			console.error(err)
			toast('error', m.khatm_copy_error())
		}
	}

	const roundTitle = $derived(khatm.getRoundTitle())

	const percent = $derived(khatm.percent)

	const canSelectLayout = $derived(!khatm.finished && khatm.isFree)
	const editHref = $derived(
		`${base}/account/khatms/${khatm.id}/edit${data.isAdmin ? '?admin=1' : ''}`,
	)
	let showAuthPrompt = $state(false)
	let showStopPrompt = $state(false)
	let showPrivateShortcutPrompt = $state(false)
	let stoppingSeries = $state(false)
	let pinningShortcut = $state(false)
	let shortcutSupported = $state(false)
	let canManageAsGuest = $state(false)
	const canRequestSeriesStop = $derived(data.canStopSeries && (data.isOwner || canManageAsGuest))
	const hasNextRound = $derived(
		khatm.isSerial && (data.seriesMaxRounds == null || khatm.roundNumber < data.seriesMaxRounds),
	)

	onMount(() => {
		let active = true
		void isKhatmShortcutSupported()
			.then((supported) => {
				if (active) shortcutSupported = supported
			})
			.catch(() => {
				if (active) shortcutSupported = false
			})
		return () => {
			active = false
		}
	})

	function requestShortcut() {
		if (khatm.private) showPrivateShortcutPrompt = true
		else void pinShortcut()
	}

	async function pinShortcut() {
		showPrivateShortcutPrompt = false
		pinningShortcut = true
		try {
			const { requested } = await pinKhatmShortcut(khatm)
			if (requested) toast('info', m.khatm_shortcut_requested())
			else toast('error', m.khatm_shortcut_unsupported())
		} catch {
			toast('error', m.khatm_shortcut_error())
		} finally {
			pinningShortcut = false
		}
	}

	function requestSeriesStop() {
		if (data.isOwner) showStopPrompt = true
		else showAuthPrompt = true
	}

	async function stopSeries(event: SubmitEvent) {
		event.preventDefault()
		stoppingSeries = true
		try {
			await apiRequest('POST', `/account/khatms/${khatm.id}/stop`, {
				origin: location.origin,
			})
			showStopPrompt = false
			await invalidateAll()
			toast('info', m.khatm_round_saved_as_last())
		} catch (cause) {
			toast('error', cause instanceof Error ? cause.message : m.khatm_stop_error())
		} finally {
			stoppingSeries = false
		}
	}

	$effect(() => {
		const khatmId = khatm.id
		const seriesId = khatm.seriesId
		let cancelled = false
		canManageAsGuest = false

		if (!data.isAuthenticated && !data.isAdmin) {
			idb_createdKhatm_hasClaim(khatmId, seriesId)
				.then((hasClaim) => {
					if (!cancelled) canManageAsGuest = hasClaim
				})
				.catch(() => {
					if (!cancelled) canManageAsGuest = false
				})
		}

		return () => {
			cancelled = true
		}
	})
</script>

<PageTitle title={khatm.title} />

<svelte:head>
	<meta name="description" content={khatm.description} />
	<meta property="og:title" content={`${khatm.title} | ${page.data.branding.name}`} />
	<meta property="og:description" content={khatm.description} />
	<meta property="og:logo" content={new URL(page.data.branding.icon512Url, page.url.origin).href} />
	<meta property="og:image" content={new URL(page.data.branding.icon512Url, page.url.origin).href} />
	<meta property="og:url" content={khatm.publicLink} />
	<meta property="og:type" content="website" />
	{#if khatm.private}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<Header title={khatm.title}>
	{#snippet end()}
		{#if shortcutSupported}
			<button
				type="button"
				class="ui-header-page-action"
				onclick={requestShortcut}
				disabled={pinningShortcut}
				aria-label={m.khatm_add_to_home_aria()}
			>
				{#if pinningShortcut}
					<span class="ui-spinner"></span>
				{:else}
					<IconAddToHome class="size-5" />
				{/if}
				<span>{m.khatm_home()}</span>
			</button>
		{/if}
		{#if data.canEdit}
			<a href={editHref} class="ui-header-page-action" aria-label={m.khatm_edit_aria()}>
				<IconEdit class="size-5" />
				<span>{m.common_edit()}</span>
			</a>
		{:else if canManageAsGuest}
			<button
				type="button"
				class="ui-header-page-action"
				onclick={() => (showAuthPrompt = true)}
				aria-label={m.khatm_manage_aria()}
			>
				<IconEdit class="size-5" />
				<span>{m.khatm_manage()}</span>
			</button>
		{/if}
		{#if canShare}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={share}
				aria-label={m.khatm_share()}
			>
				<IconShare class="size-5" />
				<span>{m.khatm_share()}</span>
			</button>
		{:else}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={copy}
				aria-label={m.khatm_copy_link()}
			>
				<IconCopy class="size-5" />
				<span>{m.khatm_copy_link()}</span>
			</button>
		{/if}
	{/snippet}
</Header>

<main class="ui-container-reading ui-khatm-page">
	<section class="ui-khatm-hero" aria-labelledby="khatm-title">
		<div class="ui-khatm-orb ui-khatm-orb-one" aria-hidden="true"></div>
		<div class="ui-khatm-orb ui-khatm-orb-two" aria-hidden="true"></div>
		<div class="ui-khatm-hero-copy">
			<div class="ui-khatm-eyebrow">
				<span class="ui-khatm-eyebrow-icon"><IconPeople /></span>
				<span>{m.khatm_hero_eyebrow()}</span>
			</div>
			<h1 id="khatm-title" class="ui-khatm-title">{khatm.title}</h1>
			<div class="ui-khatm-badges">
				{#if khatm.isSerial}
					<div class="ui-khatm-series-status">
						<span class="ui-badge ui-badge-accent">
							{roundTitle}
							{#if data.seriesMaxRounds != null}
								{m.khatm_round_of({ total: data.seriesMaxRounds.toLocaleString(localeTag()) })}
							{/if}
						</span>
						{#if canRequestSeriesStop}
							<button
								type="button"
								class="ui-btn ui-btn-xs ui-khatm-series-stop"
								onclick={requestSeriesStop}
								aria-label={m.khatm_stop_after_round_aria()}
							>
								<IconStop />
								<span>{m.khatm_stop_after_round()}</span>
							</button>
						{/if}
					</div>
				{/if}
				<span class="ui-badge ui-badge-info ui-range-type-badge">
					<RangeTypeIcon type={khatm.rangeType} />
					{khatm.rangeTypeTitle}
				</span>
				{#if khatm.private}<span class="ui-badge ui-badge-neutral">{m.khatm_private()}</span>{/if}
			</div>
			{#if khatm.description}
				<div dir="auto" class="ui-khatm-description">
					<ExpandableText text={khatm.description} maxLength={250} threshold={10} />
				</div>
			{/if}
		</div>

		<div class="ui-khatm-progress-card">
			<div class="ui-khatm-progress-heading">
				<span class="ui-khatm-progress-icon"><IconBook /></span>
				<div>
					<strong>{m.khatm_progress()}</strong>
					<span>{m.khatm_progress_hint()}</span>
				</div>
			</div>
			<div class="ui-khatm-progress-value">
				<strong>{formatPercent(percent)}</strong>
			</div>
			<progress
				class="ui-progress ui-progress-success"
				max={100}
				value={percent}
				aria-label={m.khatm_progress()}
			></progress>
		</div>
	</section>

	{#if khatm.reviewStatus !== 'approved'}
		<section class="ui-alert ui-alert-info" role="alert" aria-label={m.khatm_unapproved_aria()}>
			<div>
				<strong>{m.khatm_unapproved_title()}</strong>
				<p>{m.khatm_unapproved_text()}</p>
			</div>
		</section>
	{/if}
	{#if khatm.aiReviewStatus === 'warning' && khatm.aiReviewReason}
		<section class="ui-alert ui-alert-error" role="alert" aria-label={m.khatm_ai_warning_aria()}>
			<div>
				<strong>{m.khatm_ai_warning_title()}</strong>
				<p>{khatm.aiReviewReason}</p>
			</div>
		</section>
	{/if}

	{#if data.isAdmin && !khatm.private}
		<KhatmReviewBar {khatm} featuredOrder={data.featuredOrder} canFeature={data.canFeature} />
	{/if}

	<KhatmParticipation {khatm} />

	{#if canSelectLayout}
		<section class="ui-khatm-view-switch" aria-label={m.khatm_view_switch_aria()}>
			<div class="ui-khatm-view-copy">
				<CurrentLayoutIcon />
				<div><strong>{m.khatm_selection_method()}</strong><span>{m.khatm_selection_method_hint()}</span></div>
			</div>
			<div class="ui-khatm-view-tabs">
				<Tab
					noScroll
					tabs={[
						{
							slug: 'wizard',
							icon: IconViewWizard,
							title: m.khatm_layout_wizard(),
							link: khatm.getLink('wizard'),
						},
						{ slug: 'list', icon: IconViewList, title: m.khatm_layout_list(), link: khatm.getLink('list') },
						{ slug: 'grid', icon: IconViewTable, title: m.khatm_layout_grid(), link: khatm.getLink('grid') },
					]}
					bind:value={() => layout, () => {}}
				/>
			</div>
		</section>
	{/if}

	<section class="ui-khatm-content">
		{#if khatm.finished}
			<div class="ui-alert ui-alert-success ui-khatm-complete">
				<p>
					{#if khatm.isSerial}
						{m.khatm_serial_complete({ round: roundTitle })}
					{:else}
						{m.khatm_complete()}
					{/if}
				</p>
				{#if khatm.isSerial}
					{#if hasNextRound}
						<button class="ui-btn ui-btn-outline" onclick={invalidateAll}>{m.khatm_start_new_round()}</button>
					{:else}
						<span class="ui-badge ui-badge-success">{m.khatm_last_round()}</span>
					{/if}
				{/if}
			</div>
		{:else}
			{@render children()}
		{/if}
	</section>
</main>

<Modal bind:open={showStopPrompt} contentClass="ui-khatm-stop-dialog">
	<div class="ui-khatm-stop-icon" aria-hidden="true"><IconStop /></div>
	<p class="ui-khatm-stop-eyebrow">{m.khatm_stop_eyebrow()}</p>
	<h2>{m.khatm_stop_title()}</h2>
	<p class="ui-khatm-stop-description">
		{m.khatm_stop_description()}
	</p>
	<div class="ui-khatm-stop-actions">
		<form onsubmit={stopSeries} aria-busy={stoppingSeries}>
			<button class="ui-btn ui-btn-danger ui-btn-block" type="submit" disabled={stoppingSeries}>
				<IconStop class="size-5" />
				{m.khatm_stop_confirm()}
			</button>
		</form>
		<button
			class="ui-btn ui-btn-ghost ui-btn-block"
			type="button"
			onclick={() => (showStopPrompt = false)}
		>
			{m.khatm_continue_rounds()}
		</button>
	</div>
</Modal>

<Modal bind:open={showPrivateShortcutPrompt} contentClass="ui-khatm-auth-dialog">
	<div class="ui-khatm-auth-icon" aria-hidden="true"><IconAddToHome /></div>
	<p class="ui-khatm-auth-eyebrow">{m.khatm_private_shortcut_eyebrow()}</p>
	<h2>{m.khatm_private_shortcut_title()}</h2>
	<p class="ui-khatm-auth-description">
		{m.khatm_private_shortcut_description()}
	</p>
	<div class="ui-khatm-auth-actions">
		<button class="ui-btn ui-btn-primary ui-btn-lg" type="button" onclick={pinShortcut}>
			<IconAddToHome class="size-5" />
			{m.khatm_add_to_home()}
		</button>
		<button
			class="ui-btn ui-btn-ghost ui-btn-lg"
			type="button"
			onclick={() => (showPrivateShortcutPrompt = false)}
		>
			{m.common_cancel()}
		</button>
	</div>
</Modal>

<Modal bind:open={showAuthPrompt} contentClass="ui-khatm-auth-dialog">
	<button
		type="button"
		class="ui-btn ui-btn-icon ui-btn-ghost ui-khatm-auth-close"
		onclick={() => (showAuthPrompt = false)}
		aria-label={m.common_close()}
	>
		<IconClose class="size-5" />
	</button>
	<div class="ui-khatm-auth-icon" aria-hidden="true">
		<IconManageAccounts />
	</div>
	<p class="ui-khatm-auth-eyebrow">{m.khatm_auth_eyebrow()}</p>
	<h2>{m.khatm_auth_title()}</h2>
	<p class="ui-khatm-auth-description">
		{m.khatm_auth_description()}
	</p>
	<div class="ui-khatm-auth-actions">
		<a class="ui-btn ui-btn-primary ui-btn-lg" href={localizeHref(`${base}/auth/login`)}>
			<IconLogin class="size-5" />
			{m.nav_login()}
		</a>
		<a class="ui-btn ui-btn-soft ui-btn-lg" href={localizeHref(`${base}/auth/register`)}>
			<IconPersonAdd class="size-5" />
			{m.auth_register_action()}
		</a>
	</div>
</Modal>
