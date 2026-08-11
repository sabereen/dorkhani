<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { juz_toRange } from '$lib/entity/Juz'
	import { page_toRange } from '$lib/entity/Page'
	import { surah_toRange } from '$lib/entity/Surah'
	import { Juz, Page, Surah, HizbQuarter } from '@ghoran/entity'
	import ConfirmRange from '../confirm-range.svelte'
	import { QuranRange } from '$lib/entity/Range'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import { hizbQuarter_toRange } from '$lib/entity/HizbQuarter'
	import { page } from '$app/state'
	import { pushState, replaceState } from '$app/navigation'
	import { useKathmContext } from '../../khatm-context.svelte'
	import type { Component } from 'svelte'
	import IconJuz from '~icons/ic/round-auto-stories'
	import IconQuarter from '~icons/ic/round-timelapse'
	import IconPage from '~icons/ic/round-insert-drive-file'
	import IconSurah from '~icons/ic/round-menu-book'
	import IconAll from '~icons/ic/round-done-all'
	import IconCheck from '~icons/ic/round-check-circle'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)

	type PageState = {
		step?: number
		modal?: boolean
	}

	let hideFinishedIntervals = $state(true)

	const modal = $derived(!!(page.state as PageState).modal)
	let selected = $state<QuranRange | null>(null)

	function select(range: QuranRange) {
		selected = range
		openModal()
	}

	function openModal() {
		if (modal) return
		pushState('', {
			modal: true,
			step,
		})
	}
	function closeModal() {
		if (modal) history.back()
	}
	function toggleModal(open = !modal) {
		if (open) openModal()
		else closeModal()
	}

	const juzList = Juz.getAll()
	const hizbQuarterList = HizbQuarter.getAll()
	const surahList = Surah.getAll()
	const pageList = Page.getAll()

	const juzRanges = juzList.map(juz_toRange)
	const hizbQuarterRanges = hizbQuarterList.map(hizbQuarter_toRange)
	const surahRanges = surahList.map(surah_toRange)
	const pageRanges = pageList.map(page_toRange)
	const allRanges = $derived(
		new QuranRange(0, COUNT_OF_AYAHS).divideByKahtmParts(parts).map(({ range }) => range),
	)

	let step = $derived((page.state as PageState).step || 1)
	let userRangeType = $state<'juz' | 'hizbQuarter' | 'page' | 'surah' | 'all'>('page')

	// مقدار rangeType منطقا اینجا هیچ وقت ayah نیست.
	// ولی برای جلوگیری از خطای تایپ‌اسکریپتی فقط روی آن شرط گذاشته ایم
	const rangeType = $derived(
		khatm.rangeType === 'free' || khatm.rangeType === 'ayah' ? userRangeType : khatm.rangeType,
	)

	function selectRangeType(type: typeof rangeType) {
		userRangeType = type
		next()
	}

	function next() {
		pushState('', {
			modal,
			step: step + 1,
		} satisfies PageState)
	}

	function closeModalAndNext() {
		replaceState('', {
			modal: false,
			step: step + 1,
		} satisfies PageState)
	}

	function goToStep(n: number) {
		if (n < step) history.go(n - step)
		selected = null
	}

	const ranges = $derived(
		{
			juz: juzRanges,
			hizbQuarter: hizbQuarterRanges,
			page: pageRanges,
			surah: surahRanges,
			all: allRanges,
		}[rangeType],
	)

	const selectableRanges = $derived.by(() => {
		let result = ranges.map((range) => ({
			percent: range.getFillPercent(parts),
			range,
		}))
		if (hideFinishedIntervals) {
			result = result.filter(({ percent }) => percent === 0)
		}
		return result
	})
</script>

{#snippet stepSelectRangeType()}
	<div class="ui-khatm-panel-header">
		<h2>دوست دارید چقدر همراه شوید؟</h2>
		<p>هر انتخاب، سهمی ارزشمند از این ختم گروهی است.</p>
	</div>
	<div class="ui-khatm-options">
		{#snippet button(type: typeof rangeType, title: string, subtitle: string, Icon: Component, wide = false)}
			<button class="ui-khatm-option" class:ui-khatm-option-wide={wide} type="button" onclick={() => selectRangeType(type)}>
				<div class="ui-khatm-option-heading">
					<span class="ui-khatm-option-icon"><Icon /></span>
					<div><strong>{title}</strong><span>{subtitle}</span></div>
				</div>
				<span class="ui-khatm-option-arrow" aria-hidden="true">←</span>
			</button>
		{/snippet}
		{@render button('juz', 'یک جزء', 'مشارکتی پیوسته و پررنگ', IconJuz)}
		{@render button('hizbQuarter', 'ربع حزب', 'کوتاه و منظم', IconQuarter)}
		{@render button('page', 'یک صفحه', 'انتخابی سبک و روزانه', IconPage)}
		{@render button('surah', 'یک سوره', 'یک سوره‌ی کامل', IconSurah)}
		{#if khatm.progress > 0.9}
			{@render button('all', 'همه‌ی بازه‌های باقی‌مانده', 'برای کامل‌کردن قدم‌های آخر ختم', IconAll, true)}
		{/if}
	</div>
{/snippet}

{#snippet stepSelectRange()}
	{#if selectableRanges.length > 0}
		<div class="ui-khatm-panel-header">
			<h2>بازه‌ی دلخواهتان را بردارید</h2>
			<p>فقط بخش‌های آزاد قابل انتخاب هستند.</p>
		</div>
		<div class="ui-khatm-toolbar">
			<label class="ui-khatm-check">
				<input type="checkbox" class="ui-checkbox" bind:checked={hideFinishedIntervals} />
				<span>فقط بازه‌های آزاد</span>
			</label>
		</div>
		<ul
			class={[
				'ui-khatm-range-grid',
				rangeType === 'all' ? 'ui-khatm-range-grid-wide' : '',
			]}
		>
			{#each selectableRanges as { range, percent }}
				{@const disabled = percent > 0}
				{@const completed = percent >= 100}
				<li class="ui-list-row">
					<button
						class="ui-btn ui-btn-soft ui-btn-block ui-khatm-range-button"
						type="button"
						{disabled}
							class:ui-btn-disabled={disabled}
						onclick={() => select(range)}
					>
						{range.title || range.getTitleSurahOrinted()}
						{#if disabled && !completed}
							<span class="flex items-center opacity-50">
								<span
									class="ui-radial-progress ml-1 mr-1"
									style:--value={percent}
									style:--size="1.4rem"
									aria-valuenow={percent}
									role="progressbar"
								>
									&lrm;{percent.toLocaleString('fa')}٪&lrm;
								</span>
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="ui-khatm-empty">
			<p>در این دسته بازه‌ی آزادی باقی نمانده است؛ نوع دیگری را امتحان کنید.</p>
			<button type="button" class="ui-btn ui-btn-primary" onclick={() => goToStep(1)}>بازگشت</button>
		</div>
	{/if}
{/snippet}

{#snippet stepShowResult(selected: QuranRange)}
	<div class="ui-khatm-confirm">
		<div class="ui-card ui-card-bordered">
			<div class="ui-card-body">
				<div class="ui-khatm-confirm-heading">
					<span class="ui-khatm-confirm-icon"><IconCheck /></span>
					<h2>این سهم برای شما ثبت شد</h2>
				</div>
				<p class="ui-khatm-confirm-range">{selected.getTitle()}</p>
				<a href={selected.getLink(khatm)} class="ui-btn ui-btn-primary ui-btn-block">مشاهده و قرائت آیات</a>
			</div>
		</div>
		<button type="button" class="ui-btn ui-btn-ghost" onclick={() => goToStep(1)}>انتخاب یک سهم دیگر</button>
	</div>
{/snippet}

<div class="ui-khatm-panel">
{#if khatm.rangeType === 'free'}
	<div class="mb-7 flex justify-center">
		<ul class="ui-steps">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li class="ui-step cursor-pointer" class:ui-step-active={step >= 1} onclick={() => goToStep(1)}>
				نوع ختم
			</li>
			<li class="ui-step" class:ui-step-active={step >= 2}>انتخاب</li>
			<li class="ui-step" class:ui-step-active={step >= 3}>اتمام</li>
		</ul>
	</div>

	{#if step === 1}
		{@render stepSelectRangeType()}
	{/if}

	{#if step === 2}
		{@render stepSelectRange()}
	{/if}

	{#if step === 3 && selected}
		{@render stepShowResult(selected)}
	{/if}
{:else}
	<!-- <div class="mb-7 flex justify-center">
		<ul class="ui-steps">
			<li class="ui-step" class:ui-step-active={step >= 1}>انتخاب</li>
			<li class="ui-step" class:ui-step-active={step >= 2}>اتمام</li>
		</ul>
	</div> -->

	{#if step === 1}
		{@render stepSelectRange()}
	{/if}

	{#if step === 2 && selected}
		{@render stepShowResult(selected)}
	{/if}
{/if}
</div>

<Modal bind:open={() => modal, toggleModal}>
	<ConfirmRange {khatm} onClose={closeModal} onFinished={closeModalAndNext} range={selected} />
</Modal>
