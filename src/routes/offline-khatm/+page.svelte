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
		idb_offlineKhatm_get,
		idb_offlineKhatm_getList,
		idb_offlineKhatm_getParts,
	} from '$lib/idb/offlineKhatm'
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
			list = await idb_offlineKhatm_getList()
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
			const khatm = await idb_offlineKhatm_get(id)
			const currentParts = await idb_offlineKhatm_getParts(id, khatm.roundNumber)
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
	<div class="offline-loading" role="status"><span class="ui-spinner"></span><span>{m.offline_preparing()}</span></div>
{:else if !supported}
	<section class="ui-card ui-card-bordered offline-unsupported">
		<div class="ui-card-body">
			<span class="offline-main-icon"><IconInstall /></span>
			<h2>{m.offline_supported_title()}</h2>
			<p>{m.offline_supported_description()}</p>
			<a class="ui-btn ui-btn-primary" href={localizeHref(`${base}/`)}>{m.offline_back_home()}</a>
		</div>
	</section>
{:else if loadError && !selected}
	<section class="ui-alert ui-alert-error" role="alert">
		<div><strong>{m.offline_failure_title()}</strong><p>{loadError}</p></div>
		<button class="ui-btn ui-btn-outline" type="button" onclick={() => selectedId ? loadSelected() : loadList()}>{m.common_retry()}</button>
	</section>
{:else if selected && reading && range}
	<OfflineReading khatm={selected} {range} onBack={() => navigate({ id: selected!.id, view })} />
{:else if selected}
	<OfflineKhatmDetail
		khatm={selected}
		{parts}
		{view}
		onView={(nextView) => navigate({ id: selected!.id, view: nextView })}
		onRead={(selectedRange) => navigate({ id: selected!.id, view: 'read', range: selectedRange.toRangeParam() })}
		onReload={() => loadSelected(selected!.id)}
		onDeleted={deleted}
	/>
{:else}
	<div class="offline-dashboard">
		<section class="offline-intro">
			<span class="offline-main-icon"><IconCloudOff /></span>
			<div>
				<p class="offline-eyebrow">{m.offline_eyebrow()}</p>
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
					<header class="offline-section-heading">
						<div><h2>{m.offline_list_title()}</h2><p>{m.offline_list_description()}</p></div>
						<span class="ui-badge ui-badge-info">{list.length.toLocaleString('fa-IR')}</span>
					</header>
					<ul class="offline-khatm-list">
						{#each list as khatm (khatm.id)}
							<li>
								<a href={route({ id: khatm.id })}>
									<span class="offline-list-icon"><IconBook /></span>
									<span class="offline-list-copy">
										<strong>{khatm.title}</strong>
										<small>{khatm.status === 'completed' ? m.offline_completed() : m.offline_progress({ percent: khatm.pageProgress.toLocaleString() })}</small>
									</span>
									{#if khatm.series}<span class="ui-badge ui-badge-accent"><IconRepeat />{m.offline_round({ count: khatm.roundNumber.toLocaleString() })}</span>{/if}
									<IconArrow />
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</section>
		{:else if !loading}
			<div class="offline-empty"><IconBook /><h2>{m.offline_empty_title()}</h2><p>{m.offline_empty_description()}</p></div>
		{/if}

		<OfflineKhatmForm onSaved={created} />
	</div>
{/if}

<style>
	.offline-dashboard,
	.offline-unsupported,
	.offline-loading {
		width: 100%;
		max-width: 52rem;
		margin-inline-start: auto;
		margin-inline-end: auto;
	}

	.offline-dashboard > * + * { margin-top: 1rem; }
	.offline-loading { display: flex; align-items: center; justify-content: center; min-height: 14rem; }
	.offline-loading > * + * { margin-inline-start: 0.6rem; }
	.offline-unsupported { text-align: center; }
	.offline-unsupported h2 { margin: 1rem 0 0; }
	.offline-unsupported p { max-width: 34rem; margin: 0.6rem auto 1rem; color: var(--ui-color-text-muted); line-height: 1.9; }
	.offline-intro { display: flex; align-items: center; padding: 1.25rem; border: 1px solid var(--ui-color-border); border-radius: var(--ui-radius-xl); background: linear-gradient(135deg, var(--ui-color-primary-soft), var(--ui-color-surface-raised)); }
	.offline-intro > * + * { margin-inline-start: 1rem; }
	.offline-main-icon { display: flex; width: 4rem; height: 4rem; flex: 0 0 4rem; align-items: center; justify-content: center; margin-inline-start: auto; margin-inline-end: auto; border-radius: 1.25rem; background: var(--ui-color-primary); color: var(--ui-color-on-primary); font-size: 2rem; }
	.offline-intro .offline-main-icon { margin: 0; }
	.offline-intro h2, .offline-intro p, .offline-section-heading h2, .offline-section-heading p { margin: 0; }
	.offline-intro > div > p:last-child, .offline-section-heading p { margin-top: 0.25rem; color: var(--ui-color-text-muted); line-height: 1.8; }
	.offline-eyebrow { color: var(--ui-color-primary); font-size: 0.75rem; font-weight: 900; }
	.offline-section-heading { display: flex; align-items: center; justify-content: space-between; }
	.offline-khatm-list { margin: 1rem 0 0; padding: 0; list-style: none; }
	.offline-khatm-list li + li { border-top: 1px solid var(--ui-color-border); }
	.offline-khatm-list a { display: flex; align-items: center; padding: 0.8rem; border-radius: var(--ui-radius-md); color: var(--ui-color-text); text-decoration: none; }
	.offline-khatm-list a:hover { background: var(--ui-color-primary-soft); }
	.offline-khatm-list a > * + * { margin-inline-start: 0.65rem; }
	.offline-list-icon { display: flex; width: 2.5rem; height: 2.5rem; flex: 0 0 2.5rem; align-items: center; justify-content: center; border-radius: 0.8rem; background: var(--ui-color-primary-soft); color: var(--ui-color-primary); }
	.offline-list-copy { min-width: 0; flex: 1 1 auto; }
	.offline-list-copy strong, .offline-list-copy small { display: block; }
	.offline-list-copy small { margin-top: 0.15rem; color: var(--ui-color-text-muted); }
	.offline-empty { padding: 2rem; border: 1px dashed var(--ui-color-border-strong); border-radius: var(--ui-radius-lg); background: var(--ui-color-surface-muted); text-align: center; }
	.offline-empty :global(svg) { width: 2.5rem; height: 2.5rem; color: var(--ui-color-primary); }
	.offline-empty h2 { margin: 0.75rem 0 0; }
	.offline-empty p { margin: 0.3rem 0 0; color: var(--ui-color-text-muted); }
	@media (max-width: 600px) {
		.offline-intro { align-items: flex-start; }
		.offline-main-icon { width: 3.25rem; height: 3.25rem; flex-basis: 3.25rem; }
		.offline-khatm-list a { align-items: flex-start; }
	}
</style>
