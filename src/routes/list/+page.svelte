<script lang="ts">
	/* eslint-disable svelte/no-unused-svelte-ignore */
	import { goto } from '$app/navigation'
	import { navigating, page } from '$app/state'
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import {
		KHATM_DIRECTORY_RANGE_TYPES,
		type KhatmDirectoryFilters,
		type KhatmDirectoryView,
	} from '$lib/entity/KhatmDirectory'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import type { RangeType } from '@prisma-client'
	import type { Component } from 'svelte'
	import IconClose from '~icons/ic/round-close'
	import IconFilter from '~icons/ic/round-filter-list'
	import IconInfinite from '~icons/ic/round-all-inclusive'
	import IconRecent from '~icons/ic/round-schedule'
	import IconSearch from '~icons/ic/round-search'
	import IconTrending from '~icons/ic/round-trending-up'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	const viewOptions: Array<{
		value: KhatmDirectoryView
		label: string
		description: string
		icon: Component
	}> = [
		{
			value: 'recent',
			label: 'تازه‌ترین',
			description: 'آخرین ختم‌های ثبت‌شده',
			icon: IconRecent,
		},
		{
			value: 'progress',
			label: 'بیشترین پیشرفت',
			description: 'ختم‌های ناتمام نزدیک‌تر به پایان',
			icon: IconTrending,
		},
		{
			value: 'continuous',
			label: 'ختم‌های پیوسته',
			description: 'بیشترین دورهای کامل‌شده',
			icon: IconInfinite,
		},
	]

	const rangeTypeTitles: Record<RangeType, string> = {
		free: 'آزاد',
		page: 'صفحه به صفحه',
		hizbQuarter: 'حزب به حزب',
		surah: 'سوره به سوره',
		juz: 'جزء به جزء',
		ayah: 'آیه به آیه',
	}

	function getFilterKey(filters: KhatmDirectoryFilters) {
		return `${filters.view}|${filters.rangeType || ''}|${filters.q}`
	}

	const { list: initialList, nextCursor: initialNextCursor, filters: initialFilters } =
		/* svelte-ignore state_referenced_locally */ data
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
				loadError = 'بارگذاری موارد بیشتر انجام نشد. دوباره تلاش کنید.'
			}
		} finally {
			if (requestKey === loadedFilterKey) loadingMore = false
		}
	}

	function getCardMeta(khatm: Khatm) {
		if (data.filters.view === 'progress') {
			return `${khatm.versesRead.toLocaleString('fa')} آیه خوانده‌شده`
		}
		if (data.filters.view === 'continuous') {
			const completedRounds = Math.max(0, khatm.roundNumber - 1)
			return `${completedRounds.toLocaleString('fa')} دور کامل‌شده`
		}
		return 'آماده برای مشارکت شما'
	}
</script>

<svelte:head>
	<title>ختم قرآن | ختم‌های ثبت‌شده</title>
</svelte:head>

<Header title="ختم‌های ثبت‌شده" />

<section class="directory-intro" aria-labelledby="directory-title">
	<div>
		<span class="directory-kicker"><IconSearch /> جستجو در جمع‌های قرآنی</span>
		<h2 id="directory-title">ختم مناسب خودتان را پیدا کنید</h2>
		<p>میان ختم‌های عمومی جستجو کنید، نوع تقسیم را انتخاب کنید و برترین‌ها را ببینید.</p>
	</div>
</section>

<section class="directory-toolbar" aria-label="جستجو و فیلتر ختم‌ها">
	<div class="directory-search-control">
		<label for="khatm-search" class="directory-control-label">
			<IconSearch aria-hidden="true" />
			<span>جستجو در عنوان و توضیحات</span>
		</label>
		<div class="directory-search-input">
			<input
				id="khatm-search"
				class="ui-input"
				type="search"
				placeholder="مثلاً ختم برای سلامتی…"
				autocomplete="off"
				bind:value={search}
			/>
			{#if search}
				<button type="button" aria-label="پاک‌کردن جستجو" onclick={clearSearch}>
					<IconClose />
				</button>
			{/if}
		</div>
	</div>

	<div class="directory-type-control">
		<label for="khatm-range-type" class="directory-control-label">
			<IconFilter aria-hidden="true" />
			<span>نوع بازه‌بندی</span>
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
			<option value="">همهٔ انواع</option>
			{#each KHATM_DIRECTORY_RANGE_TYPES as rangeType}
				<option value={rangeType}>{rangeTypeTitles[rangeType]}</option>
			{/each}
		</select>
	</div>
</section>

<div class="directory-views" role="group" aria-label="شیوهٔ مرتب‌سازی ختم‌ها">
	{#each viewOptions as option}
		{@const ViewIcon = option.icon}
		<button
			type="button"
			aria-pressed={data.filters.view === option.value}
			class:directory-view-active={data.filters.view === option.value}
			onclick={() => updateUrl({ view: option.value })}
		>
			<span class="directory-view-icon"><ViewIcon /></span>
			<span>
				<strong>{option.label}</strong>
				<small>{option.description}</small>
			</span>
		</button>
	{/each}
</div>

<section
	id="khatm-results"
	class:directory-results-loading={filterLoading}
	class="ui-khatm-collection directory-results"
	aria-busy={filterLoading}
	aria-live="polite"
>
	<header class="ui-khatm-collection-header directory-results-header">
		<div>
			<h2>{viewOptions.find((option) => option.value === data.filters.view)?.label}</h2>
			<p>
				{#if data.filters.q}
					نتایج مرتبط با «{data.filters.q}»
				{:else if data.filters.rangeType}
					ختم‌های {rangeTypeTitles[data.filters.rangeType]}
				{:else}
					یک ختم را انتخاب کنید و سهم خود را برای قرائت بردارید.
				{/if}
			</p>
		</div>
		{#if filtering}
			<button class="ui-btn ui-btn-ghost ui-btn-sm" type="button" onclick={resetFilters}>
				پاک‌کردن فیلترها
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
		<div class="directory-empty">
			<span aria-hidden="true"><IconSearch /></span>
			<h3>ختمی پیدا نشد</h3>
			<p>
				{filtering
					? 'عبارت جستجو یا نوع بازه را تغییر دهید و دوباره امتحان کنید.'
					: 'هنوز ختمی در این دسته برای نمایش وجود ندارد.'}
			</p>
			{#if filtering}
				<button class="ui-btn ui-btn-soft ui-btn-sm" type="button" onclick={resetFilters}>
					نمایش همهٔ ختم‌ها
				</button>
			{/if}
		</div>
	{/if}

	{#if loadError}
		<div class="ui-alert ui-alert-error directory-load-error" role="alert">
			<span>{loadError}</span>
			<button class="ui-btn ui-btn-outline ui-btn-sm" type="button" onclick={nextPage}
				>تلاش دوباره</button
			>
		</div>
	{/if}

	{#if nextCursor && khatms.length > 0 && !loadError}
		<div class="ui-khatm-collection-footer">
			<button class="ui-btn ui-btn-soft ui-btn-sm" onclick={nextPage} disabled={loadingMore}>
				{loadingMore ? 'در حال بارگذاری…' : 'نمایش موارد بیشتر'}
			</button>
		</div>
	{/if}
</section>

<style>
	.directory-intro {
		position: relative;
		margin-top: 1rem;
		padding: 1.5rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.5rem;
		background: linear-gradient(135deg, var(--ui-color-primary-soft), var(--ui-color-surface));
		overflow: hidden;
	}

	.directory-intro:after {
		position: absolute;
		top: -4rem;
		left: -3rem;
		width: 10rem;
		height: 10rem;
		border-radius: 9999px;
		background: var(--ui-color-primary-soft);
		content: '';
		opacity: 0.75;
	}

	.directory-intro > div {
		position: relative;
		z-index: 1;
	}

	.directory-intro h2,
	.directory-intro p {
		margin: 0;
	}

	.directory-intro h2 {
		margin-top: 0.55rem;
		font-size: 1.35rem;
		font-weight: 950;
	}

	.directory-intro p {
		margin-top: 0.35rem;
		color: var(--ui-color-text-muted);
		font-size: 0.85rem;
		line-height: 1.8;
	}

	.directory-kicker,
	.directory-control-label {
		display: flex;
		align-items: center;
		color: var(--ui-color-primary);
		font-size: 0.75rem;
		font-weight: 900;
	}

	.directory-kicker > :global(*) + :global(*),
	.directory-control-label > :global(*) + :global(*) {
		margin-right: 0.35rem;
	}

	.directory-kicker :global(svg),
	.directory-control-label :global(svg) {
		width: 1.05rem;
		height: 1.05rem;
	}

	.directory-toolbar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.35fr);
		grid-gap: 0.8rem;
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.25rem;
		background: var(--ui-color-surface);
		box-shadow: var(--ui-shadow-sm);
	}

	.directory-control-label {
		margin-bottom: 0.45rem;
		color: var(--ui-color-text-muted);
	}

	.directory-search-input {
		position: relative;
	}

	.directory-search-input .ui-input {
		padding-left: 3rem;
	}

	.directory-search-input button {
		position: absolute;
		top: 0.45rem;
		bottom: 0.45rem;
		left: 0.45rem;
		display: flex;
		width: 2.1rem;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 0.6rem;
		background: var(--ui-color-surface-muted);
		color: var(--ui-color-text-muted);
		cursor: pointer;
	}

	.directory-search-input button:hover {
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.directory-search-input button:focus {
		outline: 3px solid rgba(99, 102, 241, 0.24);
		outline-offset: 1px;
	}

	.directory-search-input button :global(svg) {
		width: 1.1rem;
		height: 1.1rem;
	}

	.directory-views {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 0.65rem;
		margin-top: 1rem;
	}

	.directory-views > button {
		display: flex;
		min-width: 0;
		align-items: center;
		padding: 0.8rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-surface);
		color: var(--ui-color-text);
		text-align: right;
		box-shadow: var(--ui-shadow-sm);
		cursor: pointer;
		transition:
			border-color 160ms ease,
			background-color 160ms ease,
			transform 100ms ease;
	}

	.directory-views > button:hover {
		border-color: var(--ui-color-border-strong);
		transform: translateY(-1px);
	}

	.directory-views > button:focus {
		outline: 3px solid rgba(99, 102, 241, 0.24);
		outline-offset: 2px;
	}

	.directory-views > .directory-view-active {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary-soft);
	}

	.directory-view-icon {
		display: flex;
		width: 2.4rem;
		height: 2.4rem;
		flex: 0 0 2.4rem;
		align-items: center;
		justify-content: center;
		margin-left: 0.65rem;
		border-radius: 0.8rem;
		background: var(--ui-color-surface-muted);
		color: var(--ui-color-primary);
	}

	.directory-view-active .directory-view-icon {
		background: var(--ui-color-primary);
		color: var(--ui-color-on-primary);
	}

	.directory-view-icon :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
	}

	.directory-views strong,
	.directory-views small {
		display: block;
	}

	.directory-views strong {
		font-size: 0.82rem;
		font-weight: 900;
	}

	.directory-views small {
		margin-top: 0.15rem;
		color: var(--ui-color-text-muted);
		font-size: 0.65rem;
		line-height: 1.5;
	}

	.directory-results {
		margin-top: 1rem;
		transition: opacity 160ms ease;
	}

	.directory-results-loading {
		opacity: 0.58;
		pointer-events: none;
	}

	.directory-results-header > .ui-btn {
		flex: 0 0 auto;
		margin-right: 1rem;
	}

	.directory-empty {
		padding: 3rem 1rem;
		border: 1px dashed var(--ui-color-border-strong);
		border-radius: 1rem;
		background: var(--ui-color-surface);
		text-align: center;
	}

	.directory-empty > span {
		display: flex;
		width: 3.5rem;
		height: 3.5rem;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		border-radius: 9999px;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.directory-empty > span :global(svg) {
		width: 1.7rem;
		height: 1.7rem;
	}

	.directory-empty h3,
	.directory-empty p {
		margin: 0;
	}

	.directory-empty h3 {
		margin-top: 0.85rem;
		font-size: 1rem;
		font-weight: 900;
	}

	.directory-empty p {
		margin-top: 0.35rem;
		color: var(--ui-color-text-muted);
		font-size: 0.78rem;
		line-height: 1.8;
	}

	.directory-empty .ui-btn {
		margin-top: 1rem;
	}

	.directory-load-error {
		justify-content: space-between;
		margin-top: 0.75rem;
	}

	.directory-load-error > * + * {
		margin-right: 1rem;
	}

	@media (max-width: 767px) {
		.directory-intro {
			padding: 1.25rem;
		}

		.directory-toolbar,
		.directory-views {
			grid-template-columns: minmax(0, 1fr);
		}

		.directory-views > button {
			padding: 0.7rem;
		}
	}

	@media (max-width: 479px) {
		.directory-intro h2 {
			font-size: 1.15rem;
		}

		.directory-results-header {
			align-items: flex-start;
			flex-direction: column;
		}

		.directory-results-header > .ui-btn {
			margin-top: 0.65rem;
			margin-right: 0;
		}

		.directory-load-error {
			align-items: stretch;
			flex-direction: column;
		}

		.directory-load-error > * + * {
			margin-top: 0.65rem;
			margin-right: 0;
		}
	}
</style>
