<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { juz_toRange } from '$lib/entity/Juz'
	import type { KhatmPart } from '$lib/entity/KhatmPart'
	import { page_toRange } from '$lib/entity/Page'
	import { surah_toRange } from '$lib/entity/Surah'
	import { Juz, Page, Surah, HizbQuarter } from '@ghoran/entity'
	import ConfirmRange from './confirm-range.svelte'
	import { QuranRange } from '$lib/entity/Range'
	import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
	import { hizbQuarter_toRange } from '$lib/entity/HizbQuarter'
	import type { Khatm } from '@prisma/client'

	type Props = {
		parts: KhatmPart[]
		khatm: Khatm
		onFinished?: () => void
	}

	const { parts, khatm }: Props = $props()

	let hideFinishedIntervals = $state(true)

	let modal = $state(false)
	let selected = $state<QuranRange | null>(null)

	function select(range: QuranRange) {
		selected = range
		modal = true
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
		new QuranRange(0, COUNT_OF_AYAHS)
			.divideByKahtmParts(parts)
			.filter((i) => !i.khatmPart)
			.map(({ range }) => range),
	)

	let step = $state(1)
	let rangeType = $state<'juz' | 'hizbQuarter' | 'page' | 'surah' | 'all'>('page')

	function selectRangeType(type: typeof rangeType) {
		rangeType = type
		next()
	}

	function next() {
		step++
	}

	function goToStep(n: number) {
		if (n < step) step = n
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
{/if}

{#if step === 2}
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
{/if}

{#if step === 3 && selected}
	<div class="flex flex-col items-center p-4">
		<div class="card bg-base-100 card-md w-96 max-w-full shadow-sm">
			<div class="card-body">
				<h2 class="card-title">بازه انتخاب شده</h2>
				<p>
					{selected.getTitle()}
				</p>
				<div class="card-actions justify-end">
					<a
						href={`https://ketabmobin.com/ayah/${selected.start}`}
						target="_blank"
						class="btn btn-primary"
					>
						مشاهده آیات
					</a>
				</div>
			</div>
		</div>
		<div class="mt-3">
			<button type="button" class="btn btn-outline btn-primary" onclick={() => goToStep(1)}>
				می‌خواهم بیشتر مشارکت کنم
			</button>
		</div>
	</div>
{/if}

<Modal bind:open={modal}>
	<ConfirmRange {khatm} onClose={() => (modal = false)} onFinished={next} range={selected} />
</Modal>
