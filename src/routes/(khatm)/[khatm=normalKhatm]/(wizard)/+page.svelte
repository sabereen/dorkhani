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
	<div class="p-4">
		<p>تا چه میزان در ختم قرآن مشارکت می‌کنید؟</p>
		<div class="mt-3">
			<div class="grid grid-cols-2 gap-2">
				{#snippet button(type: typeof rangeType, title: string, span = 1)}
					<button
						class="btn btn-primary btn-soft btn-block"
						style:grid-column-end={`span ${span}`}
						type="button"
						onclick={() => selectRangeType(type)}
					>
						{title}
					</button>
				{/snippet}
				{@render button('juz', 'یک جزء')}
				{@render button('hizbQuarter', 'یک چهارم حزب')}
				{@render button('page', 'یک صفحه')}
				{@render button('surah', 'یک سوره')}
				{@render button('all', 'تمام بازه‌ها', 2)}
			</div>
		</div>
	</div>
{/snippet}

{#snippet stepSelectRange()}
	{#if selectableRanges.length > 0}
		<p class="mb-2 px-2">یکی از موارد باقی‌مانده را انتخاب کنید.</p>
		<div>
			<label class="my-2 block">
				<input type="checkbox" class="checkbox" bind:checked={hideFinishedIntervals} />
				پنهان کردن بازه‌های قرائت شده
			</label>
		</div>
		<ul
			class={[
				'grid gap-2 px-2',
				rangeType === 'all' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-3 sm:grid-cols-4',
			]}
		>
			{#each selectableRanges as { range, percent }}
				<li class="list-row grow">
					<button
						class="btn btn-primary btn-soft btn-block"
						type="button"
						disabled={percent > 0}
						onclick={() => select(range)}
					>
						{range.title || range.getTitleSurahOrinted()}
						{#if percent > 0 && percent < 100}
							<span class="flex items-center">
								<span
									class="radial-progress text-primary ms-1 me-1 text-[0.6rem] opacity-50"
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
		<p class="mb-2 text-center">موردی جهت انتخاب وجود ندارد. نوع بازه‌ی دیگری را انتخاب کنید.</p>
		<div class="flex items-center justify-center">
			<button type="button" class="btn btn-primary" onclick={() => goToStep(1)}>بازگشت</button>
		</div>
	{/if}
{/snippet}

{#snippet stepShowResult(selected: QuranRange)}
	<div class="flex flex-col items-center p-4">
		<div class="card bg-base-200 card-md w-96 max-w-full shadow-sm">
			<div class="card-body">
				<h2 class="card-title">بازه انتخاب شده</h2>
				<p>
					{selected.getTitle()}
				</p>
				<div class="card-actions justify-end">
					<a href={selected.externalLink} target="_blank" class="btn btn-primary"> مشاهده آیات </a>
				</div>
			</div>
		</div>
		<div class="mt-3">
			<button type="button" class="btn btn-outline btn-primary" onclick={() => goToStep(1)}>
				می‌خواهم بیشتر مشارکت کنم
			</button>
		</div>
	</div>
{/snippet}

{#if khatm.rangeType === 'free'}
	<div class="mb-7 flex justify-center">
		<ul class="steps steps-horizontal">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li class="step cursor-pointer" class:step-primary={step >= 1} onclick={() => goToStep(1)}>
				نوع ختم
			</li>
			<li class="step" class:step-primary={step >= 2}>انتخاب</li>
			<li class="step" class:step-primary={step >= 3}>اتمام</li>
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
		<ul class="steps steps-horizontal">
			<li class="step" class:step-primary={step >= 1}>انتخاب</li>
			<li class="step" class:step-primary={step >= 2}>اتمام</li>
		</ul>
	</div> -->

	{#if step === 1}
		{@render stepSelectRange()}
	{/if}

	{#if step === 2 && selected}
		{@render stepShowResult(selected)}
	{/if}
{/if}

<Modal bind:open={() => modal, toggleModal}>
	<ConfirmRange {khatm} onClose={closeModal} onFinished={closeModalAndNext} range={selected} />
</Modal>
