<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { juz_toRange } from '$lib/entity/Juz'
	import type { KhatmPart } from '$lib/entity/KhatmPart'
	import { page_toRange } from '$lib/entity/Page'
	import { surah_toRange } from '$lib/entity/Surah'
	import { Juz, Page, Surah } from '@ghoran/entity'
	import ConfirmRange from './confirm-range.svelte'
	import type { QuranRange } from '$lib/entity/Range'

	type Props = {
		parts: KhatmPart[]
		onFinished?: () => void
	}

	const { parts }: Props = $props()

	let modal = $state(false)
	let selected = $state<QuranRange | null>(null)

	function select(range: QuranRange) {
		selected = range
		modal = true
	}

	const juzList = Juz.getAll()
	const surahList = Surah.getAll()
	const pageList = Page.getAll()

	const juzRanges = juzList.map(juz_toRange)
	const surahRanges = surahList.map(surah_toRange)
	const pageRanges = pageList.map(page_toRange)

	let step = $state(1)
	let rangeType = $state<'juz' | 'page' | 'surah'>('page')

	function next() {
		step++
	}

	const ranges = $derived(
		{
			juz: juzRanges,
			page: pageRanges,
			surah: surahRanges,
		}[rangeType],
	)

	const selectableRanges = $derived(ranges.filter((r) => r.getFillPercent(parts) === 0))
</script>

<div class="mb-7 flex justify-center">
	<ul class="steps steps-horizontal">
		<li class="step" class:step-primary={step >= 1}>نوع ختم</li>
		<li class="step" class:step-primary={step >= 2}>انتخاب</li>
		<li class="step" class:step-primary={step >= 3}>اتمام</li>
	</ul>
</div>

{#if step === 1}
	<div class="p-4">
		<p>تا چه میزان می‌خواهید در ختم قرآن مشارکت داشته باشید؟</p>
		<div class="mt-2">
			<select class="select" bind:value={rangeType}>
				<option value="juz">یک جزء</option>
				<option value="page">یک صفحه</option>
				<option value="surah">یک سوره</option>
			</select>
		</div>
		<button class="btn btn-primary mt-2" type="button" onclick={next}>ادامه</button>
	</div>
{/if}

{#if step === 2}
	<p class="mb-2">یکی از موارد باقی‌مانده را انتخاب کنید.</p>
	<ul class="grid grid-cols-3 gap-2 sm:grid-cols-4">
		{#each selectableRanges as range}
			<li class="list-row grow">
				<button
					class="btn btn-primary btn-soft btn-block"
					type="button"
					onclick={() => select(range)}
				>
					{range.title}
				</button>
			</li>
		{/each}
	</ul>
{/if}

{#if step === 3 && selected}
	<div class="flex justify-center">
		<div class="card bg-base-100 card-md w-96 shadow-sm">
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
	</div>
{/if}

<Modal bind:open={modal}>
	<ConfirmRange onClose={() => (modal = false)} onFinished={next} range={selected} />
</Modal>
