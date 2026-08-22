<script lang="ts">
	import { HizbQuarter, Juz, Page, Surah } from '@ghoran/entity'
	import Modal from '$lib/components/Modal.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'
	import type { OfflineKhatmPartRecord, OfflineKhatmRecord, RangeType } from '$lib/contracts/domain'
	import { hizbQuarter_toRange } from '$lib/entity/HizbQuarter'
	import { juz_toRange } from '$lib/entity/Juz'
	import { page_toRange } from '$lib/entity/Page'
	import { QuranRange } from '$lib/entity/Range'
	import { surah_toRange } from '$lib/entity/Surah'
	import {
		idb_offlineKhatm_delete,
		idb_offlineKhatm_pickNextAyat,
		idb_offlineKhatm_pickRange,
		idb_offlineKhatm_startNextRound,
		idb_offlineKhatm_stopSeries,
	} from '$lib/idb/offlineKhatm'
	import { formatPercent, localeTag } from '$lib/i18n/format'
	import OfflineKhatmForm from './OfflineKhatmForm.svelte'
	import IconBook from '~icons/ic/round-menu-book'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconDelete from '~icons/ic/round-delete-outline'
	import IconEdit from '~icons/ic/round-edit'
	import IconGrid from '~icons/ic/round-grid-view'
	import IconList from '~icons/ic/round-format-list-bulleted'
	import IconNext from '~icons/ic/round-arrow-back'
	import IconRepeat from '~icons/ic/round-autorenew'
	import IconStop from '~icons/ic/round-stop-circle'
	import IconWizard from '~icons/ic/twotone-view-carousel'

	type View = 'wizard' | 'list' | 'grid'
	type FreeUnit = Exclude<RangeType, 'free' | 'ayah'>
	type Props = {
		khatm: OfflineKhatmRecord
		parts: OfflineKhatmPartRecord[]
		view: View
		onView: (view: View) => void
		onRead: (range: QuranRange) => void
		onReload: () => Promise<void> | void
		onDeleted: () => void
	}

	const { khatm, parts, view, onView, onRead, onReload, onDeleted }: Props = $props()
	let freeUnit = $state<FreeUnit>('page')
	let selected = $state<QuranRange | null>(null)
	let confirmOpen = $state(false)
	let picked = $state(false)
	let actionError = $state('')
	let working = $state(false)
	let editOpen = $state(false)
	let deleteOpen = $state(false)
	let stopOpen = $state(false)
	const freeUnitLabels: Record<FreeUnit, string> = {
		page: 'صفحه',
		hizbQuarter: 'ربع حزب',
		surah: 'سوره',
		juz: 'جزء',
	}

	const rangeTypeTitle = $derived(
		{
			free: 'آزاد',
			page: 'صفحه‌به‌صفحه',
			hizbQuarter: 'ربع حزب',
			surah: 'سوره‌به‌سوره',
			juz: 'جزءبه‌جزء',
			ayah: 'آیه‌به‌آیه',
		}[khatm.rangeType],
	)
	const activeType = $derived<FreeUnit>(khatm.rangeType === 'free' ? freeUnit : (khatm.rangeType as FreeUnit))
	const baseRanges = $derived(getRanges(activeType))
	const rangeItems = $derived(
		baseRanges.map((range) => ({ range, available: availableRanges(range, parts) })),
	)
	const visibleRangeItems = $derived(
		view === 'wizard'
			? rangeItems.filter((item) => item.available.length > 0).slice(0, 30)
			: rangeItems,
	)

	function getRanges(type: FreeUnit) {
		switch (type) {
			case 'juz':
				return Juz.getAll().map(juz_toRange)
			case 'hizbQuarter':
				return HizbQuarter.getAll().map(hizbQuarter_toRange)
			case 'surah':
				return Surah.getAll().map(surah_toRange)
			case 'page':
				return Page.getAll().map(page_toRange)
		}
	}

	function availableRanges(base: QuranRange, selectedParts: OfflineKhatmPartRecord[]) {
		const overlaps = selectedParts
			.filter((part) => part.start < base.end && base.start < part.end)
			.sort((a, b) => a.start - b.start)
		const result: QuranRange[] = []
		let cursor = base.start
		for (const part of overlaps) {
			if (cursor < part.start) result.push(new QuranRange(cursor, Math.min(part.start, base.end)))
			cursor = Math.max(cursor, part.end)
			if (cursor >= base.end) break
		}
		if (cursor < base.end) result.push(new QuranRange(cursor, base.end))
		return result
	}

	function requestPick(range: QuranRange) {
		selected = range
		picked = false
		actionError = ''
		confirmOpen = true
	}

	async function pickSelected() {
		if (!selected || working) return
		working = true
		actionError = ''
		try {
			await idb_offlineKhatm_pickRange(khatm.id, selected)
			picked = true
			await onReload()
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : 'ثبت بازه ناموفق بود.'
		} finally {
			working = false
		}
	}

	async function pickAyat(count: number) {
		if (working) return
		working = true
		actionError = ''
		try {
			const result = await idb_offlineKhatm_pickNextAyat(khatm.id, count)
			await onReload()
			onRead(result.range)
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : 'انتخاب آیات ناموفق بود.'
		} finally {
			working = false
		}
	}

	async function startNextRound() {
		working = true
		try {
			await idb_offlineKhatm_startNextRound(khatm.id)
			await onReload()
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : 'شروع دور جدید ناموفق بود.'
		} finally {
			working = false
		}
	}

	async function stopSeries() {
		working = true
		try {
			await idb_offlineKhatm_stopSeries(khatm.id)
			stopOpen = false
			await onReload()
		} finally {
			working = false
		}
	}

	async function removeKhatm() {
		working = true
		try {
			await idb_offlineKhatm_delete(khatm.id)
			onDeleted()
		} finally {
			working = false
		}
	}

	async function savedEdit() {
		editOpen = false
		await onReload()
	}
</script>

<div class="offline-detail">
	<section class="ui-khatm-hero offline-hero" aria-labelledby="offline-detail-title">
		<div class="ui-khatm-hero-copy">
			<div class="ui-khatm-eyebrow"><IconBook /><span>ختم شخصی ذخیره‌شده روی این دستگاه</span></div>
			<h1 id="offline-detail-title" class="ui-khatm-title">{khatm.title}</h1>
			<div class="offline-badges">
				<span class="ui-badge ui-badge-info"><RangeTypeIcon type={khatm.rangeType} />{rangeTypeTitle}</span>
				<span class="ui-badge ui-badge-neutral">آفلاین</span>
				{#if khatm.series}<span class="ui-badge ui-badge-accent">دور {khatm.roundNumber.toLocaleString(localeTag())}</span>{/if}
			</div>
			{#if khatm.description}<p class="offline-description" dir="auto">{khatm.description}</p>{/if}
			<div class="offline-actions">
				<button class="ui-btn ui-btn-ghost ui-btn-sm" type="button" onclick={() => (editOpen = true)}><IconEdit />ویرایش</button>
				<button class="ui-btn ui-btn-ghost ui-btn-sm" type="button" onclick={() => (deleteOpen = true)}><IconDelete />حذف</button>
				{#if khatm.series && !khatm.seriesStopped}
					<button class="ui-btn ui-btn-ghost ui-btn-sm" type="button" onclick={() => (stopOpen = true)}><IconStop />توقف پس از این دور</button>
				{/if}
			</div>
		</div>
		<div class="ui-khatm-progress-card">
			<strong>پیشرفت دور جاری</strong>
			<div class="offline-progress-value">{formatPercent(khatm.pageProgress)}</div>
			<progress class="ui-progress ui-progress-success" max="100" value={khatm.pageProgress} aria-label="پیشرفت ختم"></progress>
			<small>{khatm.versesRead.toLocaleString(localeTag())} آیه ثبت شده است</small>
		</div>
	</section>

	{#if actionError}<div class="ui-alert ui-alert-error" role="alert">{actionError}</div>{/if}

	{#if parts.length}
		<section class="ui-card ui-card-bordered offline-parts">
			<div class="ui-card-body">
				<h2>بازه‌های خوانده‌شده در این دور</h2>
				<ul class="ui-list">
					{#each [...parts].reverse().slice(0, 8) as part (part.id)}
						<li class="ui-list-row"><IconCheck /><span>{new QuranRange(part.start, part.end).getTitle()}</span></li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}

	{#if khatm.completedRounds.length}
		<section class="ui-card ui-card-bordered offline-round-history">
			<div class="ui-card-body">
				<h2>دورهای کامل‌شده</h2>
				<ul class="ui-list">
					{#each [...khatm.completedRounds].reverse() as round (round.roundNumber)}
						<li class="ui-list-row">
							<IconCheck />
							<span>دور {round.roundNumber.toLocaleString(localeTag())}</span>
							<time datetime={round.completed.toISOString()}>{round.completed.toLocaleDateString(localeTag())}</time>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}

	{#if khatm.status === 'completed'}
		<section class="ui-alert ui-alert-success offline-completed">
			<IconCheck />
			<div>
				<h2>{khatm.series ? `دور ${khatm.roundNumber.toLocaleString(localeTag())} کامل شد` : 'این ختم قرآن کامل شد'}</h2>
				<p>تمام آیات قرآن در این دور ثبت شده‌اند.</p>
			</div>
			{#if khatm.series && !khatm.seriesStopped}
				<button class="ui-btn ui-btn-outline" type="button" disabled={working} onclick={startNextRound}><IconRepeat />شروع دور جدید</button>
			{/if}
		</section>
	{:else if khatm.rangeType === 'ayah'}
		<section class="ui-card ui-card-bordered offline-ayah-picker">
			<div class="ui-card-body">
				<h2>سهم بعدی از ختم</h2>
				<p class="ui-text-muted">آیات بعدی به‌ترتیب ثبت و برای مطالعه نمایش داده می‌شوند.</p>
				<div class="offline-ayah-actions">
					<button class="ui-btn ui-btn-primary ui-btn-lg" type="button" disabled={working} onclick={() => pickAyat(1)}>پذیرفتن یک آیه</button>
					{#each [3, 5, 7, 10] as count}
						<button class="ui-btn ui-btn-outline" type="button" disabled={working} onclick={() => pickAyat(count)}>{count.toLocaleString(localeTag())} آیهٔ متوالی</button>
					{/each}
				</div>
			</div>
		</section>
	{:else}
		{#if khatm.rangeType === 'free'}
			<section class="offline-view-switch" aria-label="شیوهٔ نمایش بازه‌ها">
				<div>
					<button class={['ui-btn', view === 'wizard' ? 'ui-btn-primary' : 'ui-btn-ghost']} type="button" onclick={() => onView('wizard')}><IconWizard />مرحله‌ای</button>
					<button class={['ui-btn', view === 'list' ? 'ui-btn-primary' : 'ui-btn-ghost']} type="button" onclick={() => onView('list')}><IconList />لیستی</button>
					<button class={['ui-btn', view === 'grid' ? 'ui-btn-primary' : 'ui-btn-ghost']} type="button" onclick={() => onView('grid')}><IconGrid />جدولی</button>
				</div>
			</section>
		{/if}

		<section class="ui-khatm-panel offline-picker">
			<header class="ui-khatm-panel-header">
				<h2>انتخاب بخش بعدی برای قرائت</h2>
				<p>با تأیید انتخاب، این بازه همان لحظه در پیشرفت ختم ثبت می‌شود.</p>
			</header>

			{#if khatm.rangeType === 'free'}
				<div class="offline-unit-picker" role="group" aria-label="اندازهٔ سهم">
					{#each ['page', 'hizbQuarter', 'surah', 'juz'] as type}
						<button class={['ui-btn', 'ui-btn-sm', freeUnit === type ? 'ui-btn-primary' : 'ui-btn-outline']} type="button" onclick={() => (freeUnit = type as FreeUnit)}>
							<RangeTypeIcon type={type as FreeUnit} />
							{freeUnitLabels[type as FreeUnit]}
						</button>
					{/each}
				</div>
			{/if}

			<div class:offline-range-grid={view === 'grid'} class:offline-range-list={view !== 'grid'}>
				{#each visibleRangeItems as item (item.range.start + ':' + item.range.end)}
					{@const completed = item.available.length === 0}
					<article class="offline-range-item" class:offline-range-item-completed={completed}>
						<div>
							<strong>{item.range.title || item.range.getTitleSurahOrinted()}</strong>
							<small>{completed ? 'خوانده‌شده' : item.available.length > 1 || item.available[0]?.length !== item.range.length ? 'بخشی خوانده‌شده' : 'آمادهٔ انتخاب'}</small>
						</div>
						{#if completed}
							<span class="ui-badge ui-badge-success"><IconCheck />کامل</span>
						{:else}
							<div class="offline-range-actions">
								{#each item.available as range (range.start + ':' + range.end)}
									<button class="ui-btn ui-btn-soft ui-btn-sm" type="button" onclick={() => requestPick(range)}>
										{range.length === item.range.length ? 'انتخاب' : range.getTitleSurahOrinted()}
										<IconNext />
									</button>
								{/each}
							</div>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/if}
</div>

<Modal bind:open={confirmOpen} contentClass="offline-confirm-dialog">
	{#if selected}
		{#if picked}
			<div class="offline-dialog-content">
				<IconCheck class="offline-dialog-icon" />
				<h2>بازه با موفقیت ثبت شد</h2>
				<p>{selected.getTitle()}</p>
				<button class="ui-btn ui-btn-primary ui-btn-block" type="button" onclick={() => onRead(selected!)}><IconBook />مشاهده و قرائت آیات</button>
				<button class="ui-btn ui-btn-ghost ui-btn-block" type="button" onclick={() => (confirmOpen = false)}>انتخاب بخش دیگر</button>
			</div>
		{:else}
			<div class="offline-dialog-content">
				<IconBook class="offline-dialog-icon" />
				<h2>این بخش به‌عنوان خوانده‌شده ثبت شود؟</h2>
				<p>{selected.getTitle()}</p>
				{#if actionError}<div class="ui-alert ui-alert-error">{actionError}</div>{/if}
				<button class="ui-btn ui-btn-primary ui-btn-block" type="button" disabled={working} onclick={pickSelected}>{working ? 'در حال ثبت…' : 'بله، ثبت شود'}</button>
				<button class="ui-btn ui-btn-ghost ui-btn-block" type="button" disabled={working} onclick={() => (confirmOpen = false)}>انصراف</button>
			</div>
		{/if}
	{/if}
</Modal>

<Modal bind:open={editOpen} contentClass="offline-edit-dialog">
	<OfflineKhatmForm {khatm} onSaved={savedEdit} onCancel={() => (editOpen = false)} />
</Modal>

<Modal bind:open={deleteOpen} contentClass="offline-confirm-dialog">
	<div class="offline-dialog-content">
		<IconDelete class="offline-dialog-icon offline-dialog-icon-danger" />
		<h2>این ختم آفلاین حذف شود؟</h2>
		<p>تمام دورها و بازه‌های ثبت‌شده برای همیشه از این دستگاه حذف می‌شوند.</p>
		<button class="ui-btn ui-btn-danger ui-btn-block" type="button" disabled={working} onclick={removeKhatm}>حذف کامل ختم</button>
		<button class="ui-btn ui-btn-ghost ui-btn-block" type="button" disabled={working} onclick={() => (deleteOpen = false)}>انصراف</button>
	</div>
</Modal>

<Modal bind:open={stopOpen} contentClass="offline-confirm-dialog">
	<div class="offline-dialog-content">
		<IconStop class="offline-dialog-icon offline-dialog-icon-danger" />
		<h2>این دور، آخرین دور باشد؟</h2>
		<p>دور جاری ادامه پیدا می‌کند، اما پس از کامل‌شدن آن دور تازه‌ای ساخته نمی‌شود.</p>
		<button class="ui-btn ui-btn-danger ui-btn-block" type="button" disabled={working} onclick={stopSeries}>توقف ختم پیوسته</button>
		<button class="ui-btn ui-btn-ghost ui-btn-block" type="button" disabled={working} onclick={() => (stopOpen = false)}>انصراف</button>
	</div>
</Modal>

<style>
	.offline-detail > * + * { margin-top: 1rem; }
	.offline-hero { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(15rem, 0.75fr); grid-gap: 1rem; }
	.offline-badges, .offline-actions, .offline-unit-picker, .offline-range-actions, .offline-ayah-actions { display: flex; flex-wrap: wrap; align-items: center; }
	.offline-badges > * + *, .offline-actions > * + *, .offline-unit-picker > * + *, .offline-range-actions > * + *, .offline-ayah-actions > * + * { margin-inline-start: 0.5rem; }
	.offline-badges, .offline-actions { margin-top: 0.75rem; }
	.offline-description { color: var(--ui-color-text-muted); line-height: 1.9; }
	.offline-progress-value { margin: 0.75rem 0; font-size: 2rem; font-weight: 950; }
	.offline-parts h2 { margin-top: 0; }
	.offline-round-history h2 { margin-top: 0; }
	.offline-parts :global(.ui-list-row), .offline-round-history :global(.ui-list-row) { display: flex; align-items: center; }
	.offline-parts :global(.ui-list-row) > * + *, .offline-round-history :global(.ui-list-row) > * + * { margin-inline-start: 0.5rem; }
	.offline-round-history time { margin-inline-start: auto; color: var(--ui-color-text-muted); }
	.offline-completed { display: flex; align-items: center; }
	.offline-completed > * + * { margin-inline-start: 0.75rem; }
	.offline-completed h2, .offline-completed p { margin: 0; }
	.offline-view-switch { display: flex; justify-content: flex-end; }
	.offline-unit-picker { margin: 1rem 0; }
	.offline-range-list, .offline-range-grid { display: grid; grid-template-columns: minmax(0, 1fr); grid-gap: 0.6rem; }
	.offline-range-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.offline-range-item { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem; border: 1px solid var(--ui-color-border); border-radius: var(--ui-radius-md); background: var(--ui-color-surface-raised); }
	.offline-range-item > * + * { margin-inline-start: 0.75rem; }
	.offline-range-item strong, .offline-range-item small { display: block; }
	.offline-range-item small { margin-top: 0.2rem; color: var(--ui-color-text-muted); }
	.offline-range-item-completed { background: var(--ui-color-surface-muted); }
	.offline-dialog-content { text-align: center; }
	.offline-dialog-content h2 { margin: 0.75rem 0 0; }
	.offline-dialog-content p { color: var(--ui-color-text-muted); line-height: 1.8; }
	.offline-dialog-content :global(.ui-btn) + :global(.ui-btn) { margin-top: 0.5rem; }
	.offline-dialog-icon { width: 3rem; height: 3rem; color: var(--ui-color-success); }
	.offline-dialog-icon-danger { color: var(--ui-color-error); }
	:global(.offline-edit-dialog) { width: 95vw; max-width: 44rem; }
	@media (max-width: 767px) {
		.offline-hero, .offline-range-grid { grid-template-columns: minmax(0, 1fr); }
		.offline-range-item { align-items: stretch; flex-direction: column; }
		.offline-range-item > * + * { margin-top: 0.65rem; margin-inline-start: 0; }
		.offline-actions, .offline-unit-picker, .offline-range-actions, .offline-ayah-actions { align-items: stretch; flex-direction: column; }
		.offline-actions > * + *, .offline-unit-picker > * + *, .offline-range-actions > * + *, .offline-ayah-actions > * + * { margin-top: 0.5rem; margin-inline-start: 0; }
	}
</style>
