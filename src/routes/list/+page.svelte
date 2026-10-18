<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import { goto } from '$app/navigation'
	import { navigating, page } from '$app/state'
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import {
		KHATM_DIRECTORY_RANGE_TYPES,
		type KhatmDirectoryFilters,
		type KhatmDirectoryView,
	} from '$lib/entity/KhatmDirectory'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { RangeType } from '$lib/contracts/domain'
	import type { Component } from 'svelte'
	import IconClose from '~icons/ic/round-close'
	import IconFilter from '~icons/ic/round-filter-list'
	import IconInfinite from '~icons/ic/round-all-inclusive'
	import IconRecent from '~icons/ic/round-schedule'
	import IconSearch from '~icons/ic/round-search'
	import IconTrending from '~icons/ic/round-trending-up'
	import type { PageProps } from './$types'
	import * as m from '$lib/paraglide/messages.js'
	import SeoHead from '$lib/components/SeoHead.svelte'

	let { data }: PageProps = $props()

	const viewOptions: Array<{
		value: KhatmDirectoryView
		label: string
		description: string
		icon: Component
	}> = [
		{
			value: 'recent',
			label: m.directory_sort_recent(),
			description: m.directory_sort_recent_description(),
			icon: IconRecent,
		},
		{
			value: 'progress',
			label: m.directory_sort_progress(),
			description: m.directory_sort_progress_description(),
			icon: IconTrending,
		},
		{
			value: 'continuous',
			label: m.directory_sort_continuous(),
			description: m.directory_sort_continuous_description(),
			icon: IconInfinite,
		},
	]

	const rangeTypeTitles: Record<RangeType, string> = {
		free: m.directory_range_free(),
		page: m.directory_range_page(),
		hizbQuarter: m.directory_range_hizb(),
		surah: m.directory_range_surah(),
		juz: m.directory_range_juz(),
		ayah: m.directory_range_ayah(),
	}

	function getFilterKey(filters: KhatmDirectoryFilters) {
		return `${filters.view}|${filters.rangeType || ''}|${filters.q}`
	}

	const {
		list: initialList,
		nextCursor: initialNextCursor,
		filters: initialFilters,
	} = /* svelte-ignore state_referenced_locally */ data
	const initialDirectoryState = {
		khatms: Khatm.fromPlainList(initialList),
		nextCursor: initialNextCursor,
		loadedFilterKey: getFilterKey(initialFilters),
		loadedSearch: initialFilters.q,
		requestedSearch: initialFilters.q,
		search: initialFilters.q,
	}
	let khatms = $state(initialDirectoryState.khatms)
	let nextCursor = $state<string | null>(initialDirectoryState.nextCursor)
	let loadedFilterKey = $state(initialDirectoryState.loadedFilterKey)
	let loadedSearch = $state(initialDirectoryState.loadedSearch)
	let requestedSearch = $state(initialDirectoryState.requestedSearch)
	let search = $state(initialDirectoryState.search)
	let loadingMore = $state(false)
	let loadError = $state('')

	const filtering = $derived(Boolean(data.filters.q || data.filters.rangeType))
	const filterLoading = $derived(
		Boolean(navigating.to && navigating.to.url.pathname === page.url.pathname),
	)

	$effect(() => {
		const nextKey = getFilterKey(data.filters)
		if (nextKey === loadedFilterKey) return
		const shouldSyncSearch = data.filters.q === requestedSearch || search.trim() === loadedSearch
		loadedFilterKey = nextKey
		loadedSearch = data.filters.q
		khatms = Khatm.fromPlainList(data.list)
		nextCursor = data.nextCursor
		if (shouldSyncSearch) {
			requestedSearch = data.filters.q
			search = data.filters.q
		}
		loadingMore = false
		loadError = ''
	})

	$effect(() => {
		const q = search.trim()
		if (q === data.filters.q || q === requestedSearch) return
		const timer = window.setTimeout(() => {
			requestedSearch = q
			updateUrl({ q }, true)
		}, 300)
		return () => window.clearTimeout(timer)
	})

	function updateUrl(updates: Partial<KhatmDirectoryFilters>, replaceState = false) {
		const filters = { ...data.filters, q: search.trim(), ...updates }
		const url = new URL(page.url)
		requestedSearch = filters.q

		if (filters.view === 'recent') url.searchParams.delete('view')
		else url.searchParams.set('view', filters.view)
		if (filters.q) url.searchParams.set('q', filters.q)
		else url.searchParams.delete('q')
		if (filters.rangeType) url.searchParams.set('rangeType', filters.rangeType)
		else url.searchParams.delete('rangeType')
		url.searchParams.delete('cursor')

		void goto(url, { replaceState, keepFocus: true, noScroll: true })
	}

	function clearSearch() {
		search = ''
		requestedSearch = ''
		updateUrl({ q: '' }, true)
	}

	function resetFilters() {
		search = ''
		requestedSearch = ''
		updateUrl({ q: '', rangeType: undefined }, true)
	}

	async function nextPage() {
		if (!nextCursor || loadingMore) return
		loadingMore = true
		loadError = ''
		const requestKey = getFilterKey(data.filters)
		try {
			const result = await Khatm.getDirectoryList({ ...data.filters, cursor: nextCursor })
			if (requestKey !== loadedFilterKey) return
			khatms = [...khatms, ...result.list]
			nextCursor = result.nextCursor
		} catch (error) {
			console.error(error)
			if (requestKey === loadedFilterKey) {
				loadError = m.directory_load_more_error()
			}
		} finally {
			if (requestKey === loadedFilterKey) loadingMore = false
		}
	}

	function getCardMeta(khatm: Khatm) {
		if (data.filters.view === 'progress') {
			return m.directory_read_count({ count: khatm.versesRead.toLocaleString(localeTag()) })
		}
		if (data.filters.view === 'continuous') {
			const completedRounds = Math.max(0, khatm.roundNumber - 1)
			return m.directory_round_count({ count: completedRounds.toLocaleString(localeTag()) })
		}
		return m.directory_ready()
	}
</script>

<PageTitle title={m.directory_title()} emitHead={false} />

<SeoHead
	meta={{
		title: `${m.directory_title()} | ${page.data.branding.name}`,
		description: m.directory_description(),
		canonicalPath: page.url.pathname,
		imagePath: `/og/home.png?l=${page.data.locale}&v=${encodeURIComponent(page.data.branding.revision)}`,
		imageAlt: page.data.branding.name,
		locale: page.data.locale,
		robots: filtering ? 'noindex, follow' : undefined,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: m.directory_title(),
			description: m.directory_description(),
			url: page.url.href,
			inLanguage: page.data.locale,
		},
	}}
/>

<Header title={m.directory_title()} />

<section class="ui-directory-intro" aria-labelledby="directory-title">
	<div>
		<span class="ui-directory-kicker"><IconSearch /> {m.directory_kicker()}</span>
		<h2 id="directory-title">{m.directory_heading()}</h2>
		<p>{m.directory_description()}</p>
	</div>
</section>

<section class="ui-directory-toolbar" aria-label={m.directory_toolbar_label()}>
	<div class="directory-search-control">
		<label for="khatm-search" class="ui-directory-control-label">
			<IconSearch aria-hidden="true" />
			<span>{m.directory_search_label()}</span>
		</label>
		<div class="ui-directory-search-input">
			<input
				id="khatm-search"
				class="ui-input"
				type="search"
				placeholder={m.directory_search_placeholder()}
				autocomplete="off"
				bind:value={search}
			/>
			{#if search}
				<button type="button" aria-label={m.directory_clear_search()} onclick={clearSearch}>
					<IconClose />
				</button>
			{/if}
		</div>
	</div>

	<div class="directory-type-control">
		<label for="khatm-range-type" class="ui-directory-control-label">
			<IconFilter aria-hidden="true" />
			<span>{m.directory_range_label()}</span>
		</label>
		<select
			id="khatm-range-type"
			class="ui-select"
			value={data.filters.rangeType || ''}
			onchange={(event) =>
				updateUrl({
					rangeType: (event.currentTarget.value || undefined) as RangeType | undefined,
				})}
		>
			<option value="">{m.directory_all_ranges()}</option>
			{#each KHATM_DIRECTORY_RANGE_TYPES as rangeType}
				<option value={rangeType}>{rangeTypeTitles[rangeType]}</option>
			{/each}
		</select>
	</div>
</section>

<div class="ui-directory-views" role="group" aria-label={m.directory_views_label()}>
	{#each viewOptions as option}
		{@const ViewIcon = option.icon}
		<button
			type="button"
			aria-pressed={data.filters.view === option.value}
			class:ui-directory-view-active={data.filters.view === option.value}
			onclick={() => updateUrl({ view: option.value })}
		>
			<span class="ui-directory-view-icon"><ViewIcon /></span>
			<span>
				<strong>{option.label}</strong>
				<small>{option.description}</small>
			</span>
		</button>
	{/each}
</div>

<section
	id="khatm-results"
	class:ui-directory-results-loading={filterLoading}
	class="ui-khatm-collection ui-directory-results"
	aria-busy={filterLoading}
	aria-live="polite"
>
	<header class="ui-khatm-collection-header ui-directory-results-header">
		<div>
			<h2>{viewOptions.find((option) => option.value === data.filters.view)?.label}</h2>
			<p>
				{#if data.filters.q}
					{m.directory_results_for({ query: data.filters.q })}
				{:else if data.filters.rangeType}
					{m.directory_range_results({ rangeType: rangeTypeTitles[data.filters.rangeType] })}
				{:else}
					{m.directory_choose_message()}
				{/if}
			</p>
		</div>
		{#if filtering}
			<button class="ui-btn ui-btn-ghost ui-btn-sm" type="button" onclick={resetFilters}>
				{m.directory_clear_filters()}
			</button>
		{/if}
	</header>

	{#if khatms.length > 0}
		<ul class="ui-khatm-card-list ui-khatm-card-list-grid">
			{#each khatms as khatm (khatm.id)}
				<li>
					<KhatmListCard
						{khatm}
						meta={getCardMeta(khatm)}
						showDescription={Boolean(data.filters.q)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="ui-directory-empty">
			<span aria-hidden="true"><IconSearch /></span>
			<h3>{m.directory_not_found()}</h3>
			<p>
				{filtering ? m.directory_change_filter() : m.directory_empty()}
			</p>
			{#if filtering}
				<button class="ui-btn ui-btn-soft ui-btn-sm" type="button" onclick={resetFilters}>
					{m.directory_show_all()}
				</button>
			{/if}
		</div>
	{/if}

	{#if loadError}
		<div class="ui-alert ui-alert-error ui-directory-load-error" role="alert">
			<span>{loadError}</span>
			<button class="ui-btn ui-btn-outline ui-btn-sm" type="button" onclick={nextPage}
				>{m.directory_retry()}</button
			>
		</div>
	{/if}

	{#if nextCursor && khatms.length > 0 && !loadError}
		<div class="ui-khatm-collection-footer">
			<button class="ui-btn ui-btn-soft ui-btn-sm" onclick={nextPage} disabled={loadingMore}>
				{loadingMore ? m.directory_loading() : m.directory_load_more()}
			</button>
		</div>
	{/if}
</section>
