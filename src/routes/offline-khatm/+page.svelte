<script lang="ts">
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { isInstalledApp } from '$lib/config/installedApp'
	import type { OfflineKhatmPartRecord, OfflineKhatmRecord } from '$lib/contracts/domain'
	import { QuranRange } from '$lib/entity/Range'
	import {
		offlineKhatm_get,
		offlineKhatm_getList,
		offlineKhatm_getParts,
	} from '$lib/storage/offlineKhatm'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import { onMount } from 'svelte'
	import OfflineKhatmDetail from './OfflineKhatmDetail.svelte'
	import OfflineKhatmForm from './OfflineKhatmForm.svelte'
	import OfflineReading from './OfflineReading.svelte'
	import IconArrow from '~icons/ic/round-arrow-back'
	import IconBook from '~icons/ic/round-menu-book'
	import IconCloudOff from '~icons/ic/round-cloud-off'
	import IconInstall from '~icons/ic/round-install-mobile'
	import IconRepeat from '~icons/ic/round-autorenew'

	type View = 'wizard' | 'list' | 'grid'

	let checked = $state(false)
	let supported = $state(false)
	let loading = $state(false)
	let list = $state<OfflineKhatmRecord[]>([])
	let selected = $state<OfflineKhatmRecord | null>(null)
	let parts = $state<OfflineKhatmPartRecord[]>([])
	let loadError = $state('')

	const selectedId = $derived(page.url.searchParams.get('id'))
	const requestedView = $derived(page.url.searchParams.get('view'))
	const view = $derived<View>(
		requestedView === 'list' || requestedView === 'grid' ? requestedView : 'wizard',
	)
	const range = $derived(QuranRange.fromRangeParam(page.url.searchParams.get('range') || ''))
	const reading = $derived(
		requestedView === 'read' && Boolean(range) && range!.getPageCount() <= 50,
	)

	onMount(() => {
		supported = isInstalledApp()
		checked = true
		if (supported) void loadList()
	})

	$effect(() => {
		if (!checked || !supported) return
		const id = selectedId
		if (id) void loadSelected(id)
		else {
			selected = null
			parts = []
		}
	})

	function route(params: Record<string, string | undefined> = {}) {
		const pathname = localizeHref(`${base}/offline-khatm`)
		const query = new URLSearchParams()
		for (const [key, value] of Object.entries(params)) if (value) query.set(key, value)
		const search = query.toString()
		return search ? `${pathname}?${search}` : pathname
	}

	async function navigate(params: Record<string, string | undefined> = {}) {
		await goto(route(params))
	}

	async function loadList() {
		loading = true
		loadError = ''
		try {
			list = await offlineKhatm_getList()
		} catch (cause) {
			loadError = cause instanceof Error ? cause.message : m.offline_open_failed()
		} finally {
			loading = false
		}
	}

	async function loadSelected(id = selectedId) {
		if (!id) return
		loading = true
		loadError = ''
		try {
			const khatm = await offlineKhatm_get(id)
			const currentParts = await offlineKhatm_getParts(id, khatm.roundNumber)
			if (id === selectedId) {
				selected = khatm
				parts = currentParts
			}
		} catch (cause) {
			loadError = cause instanceof Error ? cause.message : m.offline_read_failed()
			selected = null
		} finally {
			loading = false
		}
	}

	async function created(khatm: OfflineKhatmRecord) {
		await loadList()
		await navigate({ id: khatm.id })
	}

	async function deleted() {
		await loadList()
		await navigate()
	}
</script>

<PageTitle title={selected?.title || m.offline_khatm_title()} />
<Header title={selected?.title || m.offline_khatm_title()} />

{#if !checked}
	<div class="ui-offline-loading" role="status">
		<span class="ui-spinner"></span><span>{m.offline_preparing()}</span>
	</div>
{:else if !supported}
	<section class="ui-card ui-card-bordered ui-offline-unsupported">
		<div class="ui-card-body">
			<span class="ui-offline-main-icon"><IconInstall /></span>
			<h2>{m.offline_supported_title()}</h2>
			<p>{m.offline_supported_description()}</p>
			<a class="ui-btn ui-btn-primary" href={localizeHref(`${base}/`)}>{m.offline_back_home()}</a>
		</div>
	</section>
{:else if loadError && !selected}
	<section class="ui-alert ui-alert-error" role="alert">
		<div>
			<strong>{m.offline_failure_title()}</strong>
			<p>{loadError}</p>
		</div>
		<button
			class="ui-btn ui-btn-outline"
			type="button"
			onclick={() => (selectedId ? loadSelected() : loadList())}>{m.common_retry()}</button
		>
	</section>
{:else if selected && reading && range}
	<OfflineReading khatm={selected} {range} onBack={() => navigate({ id: selected!.id, view })} />
{:else if selected}
	<OfflineKhatmDetail
		khatm={selected}
		{parts}
		{view}
		onView={(nextView) => navigate({ id: selected!.id, view: nextView })}
		onRead={(selectedRange) =>
			navigate({ id: selected!.id, view: 'read', range: selectedRange.toRangeParam() })}
		onReload={() => loadSelected(selected!.id)}
		onDeleted={deleted}
	/>
{:else}
	<div class="ui-offline-dashboard">
		<section class="ui-offline-intro">
			<span class="ui-offline-main-icon"><IconCloudOff /></span>
			<div>
				<p class="ui-offline-eyebrow">{m.offline_eyebrow()}</p>
				<h2>{m.offline_heading()}</h2>
				<p>{m.offline_description()}</p>
			</div>
		</section>

		<section class="ui-alert ui-alert-info" role="note">
			<strong>{m.offline_important()}</strong>
			<span>{m.offline_data_warning()}</span>
		</section>

		{#if list.length}
			<section class="ui-card ui-card-bordered offline-list-card">
				<div class="ui-card-body">
					<header class="ui-offline-section-heading">
						<div>
							<h2>{m.offline_list_title()}</h2>
							<p>{m.offline_list_description()}</p>
						</div>
						<span class="ui-badge ui-badge-info">{list.length.toLocaleString('fa-IR')}</span>
					</header>
					<ul class="ui-offline-khatm-list">
						{#each list as khatm (khatm.id)}
							<li>
								<a href={route({ id: khatm.id })}>
									<span class="ui-offline-list-icon"><IconBook /></span>
									<span class="ui-offline-list-copy">
										<strong>{khatm.title}</strong>
										<small
											>{khatm.status === 'completed'
												? m.offline_completed()
												: m.offline_progress({
														percent: khatm.pageProgress.toLocaleString(),
													})}</small
										>
									</span>
									{#if khatm.series}<span class="ui-badge ui-badge-accent"
											><IconRepeat />{m.offline_round({
												count: khatm.roundNumber.toLocaleString(),
											})}</span
										>{/if}
									<IconArrow class="ltr:mirror" />
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</section>
		{:else if !loading}
			<div class="ui-offline-empty">
				<IconBook />
				<h2>{m.offline_empty_title()}</h2>
				<p>{m.offline_empty_description()}</p>
			</div>
		{/if}

		<OfflineKhatmForm onSaved={created} />
	</div>
{/if}
