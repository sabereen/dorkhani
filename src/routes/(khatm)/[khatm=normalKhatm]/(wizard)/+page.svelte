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
	import IconAll from '~icons/ic/round-done-all'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconSearch from '~icons/ic/round-search'
	import IconArrow from '~icons/ic/round-arrow-back'
	import IconTune from '~icons/ic/round-tune'
	import IconBook from '~icons/ic/round-menu-book'
	import IncompleteRangePicker from './IncompleteRangePicker.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const rawParts = $derived(khatmContext.rawParts)
	const participation = $derived(khatm.participation)

	type RangeType = 'juz' | 'hizbQuarter' | 'page' | 'surah' | 'all'
	type PageState = {
		step?: number
		modal?: boolean
	}

	let hideFinishedIntervals = $state(true)
	let rangeQuery = $state('')
	let visibleRangeLimit = $state(30)

	const modal = $derived(!!(page.state as PageState).modal)
	let selected = $state<QuranRange | null>(null)
	let selectionMode = $state<'direct' | 'subrange'>('direct')

	function select(range: QuranRange, percent: number) {
		selected = range
		selectionMode = percent > 0 && percent < 100 ? 'subrange' : 'direct'
		openModal()
	}

	function finishSubrange(range: QuranRange) {
		selected = range
		closeModalAndNext()
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

	const juzRanges = Juz.getAll().map(juz_toRange)
	const hizbQuarterRanges = HizbQuarter.getAll().map(hizbQuarter_toRange)
	const surahRanges = Surah.getAll().map(surah_toRange)
	const pageRanges = Page.getAll().map(page_toRange)
	const allRanges = $derived(
		new QuranRange(0, COUNT_OF_AYAHS).divideByKahtmParts(parts).map(({ range }) => range),
	)

	let step = $derived((page.state as PageState).step || 1)
	let userRangeType = $state<RangeType>('page')

	// مقدار rangeType منطقا اینجا هیچ وقت ayah نیست.
	// ولی برای جلوگیری از خطای تایپ‌اسکریپتی فقط روی آن شرط گذاشته‌ایم.
	const rangeType = $derived<RangeType>(
		khatm.rangeType === 'free' || khatm.rangeType === 'ayah' ? userRangeType : khatm.rangeType,
	)

	const rangeTypeTitle = $derived(
		{
			juz: 'جزء',
			hizbQuarter: 'ربع حزب',
			page: 'صفحه',
			surah: 'سوره',
			all: 'بخش باقی‌مانده',
		}[rangeType],
	)

	function selectRangeType(type: RangeType) {
		userRangeType = type
		rangeQuery = ''
		visibleRangeLimit = 30
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
		rangeQuery = ''
		visibleRangeLimit = 30
	}

	function normalizeQuery(value: string) {
		return value
			.trim()
			.toLocaleLowerCase('fa')
			.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
			.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
			.replace(/ي/g, 'ی')
			.replace(/ك/g, 'ک')
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

	const rangeItems = $derived(
		ranges.map((range) => {
			const myLength = participation.getOverlapLength(range)
			return {
				percent: range.getFillPercent(parts),
				myLength,
				range,
			}
		}),
	)

	const availableRangeCount = $derived(rangeItems.filter(({ percent }) => percent < 100).length)
	const filteredRanges = $derived.by(() => {
		const query = normalizeQuery(rangeQuery)
		return rangeItems.filter(({ range, percent }) => {
			if (hideFinishedIntervals && percent >= 100) return false
			if (!query) return true
			return normalizeQuery(range.title || range.getTitleSurahOrinted()).includes(query)
		})
	})
	const visibleRanges = $derived(filteredRanges.slice(0, visibleRangeLimit))
</script>

{#snippet rangeTypeOption(
	type: RangeType,
	title: string,
	description: string,
	meta: string,
	recommended = false,
)}
	<button
		class="ui-khatm-commitment"
		class:ui-khatm-commitment-recommended={recommended}
		type="button"
		onclick={() => selectRangeType(type)}
	>
		<span class="ui-khatm-commitment-icon">
			{#if type === 'all'}<IconAll />{:else}<RangeTypeIcon {type} />{/if}
		</span>
		<span class="ui-khatm-commitment-copy">
			<span class="ui-khatm-commitment-title">
				<strong>{title}</strong>
			</span>
			<span>{description}</span>
		</span>
		<span class="ui-khatm-commitment-meta">{meta}</span>
		<span class="ui-khatm-commitment-arrow" aria-hidden="true"><IconArrow /></span>
	</button>
{/snippet}

{#snippet stepSelectRangeType()}
	<div class="ui-khatm-wizard-heading">
		<span class="ui-khatm-wizard-kicker">میزان همراهی شما</span>
		<h2>از یک سهم کوچک و دل‌خواه شروع کنید</h2>
		<p>
			اندازه‌ای را انتخاب کنید که با فرصت امروزتان هماهنگ است؛ در مرحله بعد بازه دقیق را برمی‌دارید.
		</p>
	</div>
	<div class="ui-khatm-commitments">
		{@render rangeTypeOption('page', 'یک صفحه', 'سبک، سریع و مناسب شروع', 'کم‌حجم', true)}
		{@render rangeTypeOption(
			'hizbQuarter',
			'یک ربع حزب',
			'چند صفحه پیوسته برای قرائتی منظم',
			'کوتاه',
		)}
		{@render rangeTypeOption('juz', 'یک جزء', 'سهمی کامل‌تر برای همراهی پررنگ', 'پیوسته')}
		{@render rangeTypeOption('surah', 'یک سوره', 'از آغاز تا پایان یک سوره', 'معنادار')}
		{#if khatm.progress > 0.9}
			{@render rangeTypeOption(
				'all',
				'همه بخش‌های باقی‌مانده',
				'قدم آخر را بردارید و ختم را کامل کنید',
				'ویژه پایان ختم',
			)}
		{/if}
	</div>
{/snippet}

{#snippet stepSelectRange()}
	<div class="ui-khatm-range-heading">
		<div>
			<span class="ui-khatm-wizard-kicker">انتخاب {rangeTypeTitle}</span>
			<h2>کدام بازه برای شما مناسب‌تر است؟</h2>
			<p>{availableRangeCount.toLocaleString('fa')} بازه هنوز سهم آزاد دارد.</p>
		</div>
		{#if khatm.rangeType === 'free'}
			<button type="button" class="ui-btn ui-btn-soft ui-btn-sm" onclick={() => goToStep(1)}>
				<IconTune />
				تغییر اندازه سهم
			</button>
		{/if}
	</div>

	{#if ranges.length > 12}
		<div class="ui-khatm-range-search">
			<label for="khatm-range-search">جست‌وجوی {rangeTypeTitle}</label>
			<div>
				<IconSearch aria-hidden="true" />
				<input
					id="khatm-range-search"
					class="ui-input"
					type="search"
					placeholder={`نام یا شماره ${rangeTypeTitle} را بنویسید`}
					bind:value={rangeQuery}
					oninput={() => (visibleRangeLimit = 30)}
				/>
			</div>
		</div>
	{/if}

	<div class="ui-khatm-range-tools">
		<div class="ui-khatm-range-legend" aria-label="راهنمای وضعیت بازه‌ها">
			<span><i class="ui-khatm-range-key ui-khatm-range-key-free"></i>کاملاً آزاد</span>
			<span><i class="ui-khatm-range-key ui-khatm-range-key-partial"></i>دارای بخش آزاد</span>
			<span><i class="ui-khatm-range-key ui-khatm-range-key-mine"></i>سهم شما</span>
		</div>
		<label class="ui-khatm-check">
			<input type="checkbox" class="ui-checkbox" bind:checked={hideFinishedIntervals} />
			<span>پنهان‌کردن تکمیل‌شده‌ها</span>
		</label>
	</div>

	{#if visibleRanges.length > 0}
		<ul class="ui-khatm-range-results" aria-label={`فهرست ${rangeTypeTitle}ها`}>
			{#each visibleRanges as { range, percent, myLength }}
				{@const completed = percent >= 100}
				{@const partial = percent > 0 && !completed}
				{@const mine = myLength > 0}
				<li>
					<button
						class="ui-khatm-range-card"
						class:ui-khatm-range-card-partial={partial}
						class:ui-khatm-range-card-mine={mine}
						type="button"
						disabled={completed}
						onclick={() => select(range, percent)}
					>
						<span class="ui-khatm-range-card-main">
							<strong>{range.title || range.getTitleSurahOrinted()}</strong>
							<span class="ui-khatm-range-card-status">
								{#if mine}
									<span class="ui-badge ui-badge-accent ui-badge-xs">
										{myLength === range.length ? 'سهم شما' : 'شامل سهم شما'}
									</span>
								{/if}
								{#if partial}
									<span class="ui-badge ui-badge-info ui-badge-xs">بخشی آزاد است</span>
								{:else if completed}
									<span class="ui-badge ui-badge-neutral ui-badge-xs">تکمیل‌شده</span>
								{:else}
									<span class="ui-badge ui-badge-success ui-badge-xs">کاملاً آزاد</span>
								{/if}
							</span>
						</span>
						{#if partial}
							<span class="ui-khatm-range-card-progress">
								<span><b>{percent.toLocaleString('fa')}٪</b> انتخاب شده</span>
								<progress
									class="ui-progress"
									max={100}
									value={percent}
									aria-label={`${percent.toLocaleString('fa')} درصد انتخاب شده`}
								></progress>
							</span>
						{/if}
						<span class="ui-khatm-range-card-action">
							{completed ? 'بدون سهم آزاد' : partial ? 'دیدن بخش‌های آزاد' : 'انتخاب این سهم'}
							{#if !completed}<IconArrow aria-hidden="true" />{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>

		{#if visibleRanges.length < filteredRanges.length}
			<div class="ui-khatm-range-more">
				<p>
					در حال نمایش {visibleRanges.length.toLocaleString('fa')} مورد از {filteredRanges.length.toLocaleString(
						'fa',
					)} مورد
				</p>
				<button
					type="button"
					class="ui-btn ui-btn-outline"
					onclick={() => (visibleRangeLimit += 30)}
				>
					نمایش موارد بیشتر
				</button>
			</div>
		{/if}
	{:else}
		<div class="ui-khatm-empty ui-khatm-wizard-empty">
			<IconSearch aria-hidden="true" />
			<h3>
				{rangeQuery ? 'بازه‌ای با این جست‌وجو پیدا نشد' : 'بازه آزادی در این دسته نمانده است'}
			</h3>
			<p>
				{rangeQuery
					? 'عبارت دیگری را امتحان کنید یا فیلتر را پاک کنید.'
					: 'اندازه دیگری برای سهمتان انتخاب کنید.'}
			</p>
			{#if rangeQuery}
				<button type="button" class="ui-btn ui-btn-soft" onclick={() => (rangeQuery = '')}
					>پاک‌کردن جست‌وجو</button
				>
			{:else if khatm.rangeType === 'free'}
				<button type="button" class="ui-btn ui-btn-primary" onclick={() => goToStep(1)}
					>انتخاب اندازه دیگر</button
				>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet stepShowResult(selectedRange: QuranRange)}
	<div class="ui-khatm-wizard-success" role="status" aria-live="polite">
		<span class="ui-khatm-wizard-success-icon"><IconCheck /></span>
		<span class="ui-khatm-wizard-kicker">انتخاب با موفقیت انجام شد</span>
		<h2>این سهم برای شما کنار گذاشته شد</h2>
		<p class="ui-khatm-wizard-success-copy">
			حالا می‌توانید آیات سهم خود را باز کنید و قرائت را آغاز کنید.
		</p>
		<div class="ui-khatm-wizard-success-range">
			<IconBook aria-hidden="true" />
			<div><span>سهم شما</span><strong>{selectedRange.getTitle()}</strong></div>
		</div>
		<a href={selectedRange.getLink(khatm)} class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block">
			<IconBook />
			مشاهده و قرائت آیات
		</a>
		<button type="button" class="ui-btn ui-btn-ghost" onclick={() => goToStep(1)}
			>انتخاب یک سهم دیگر</button
		>
	</div>
{/snippet}

<section class="ui-khatm-wizard" aria-labelledby="wizard-title">
	<h2 id="wizard-title" class="ui-sr-only">انتخاب مرحله‌ای سهم ختم قرآن</h2>
	<nav class="ui-khatm-wizard-progress" aria-label="مراحل انتخاب سهم">
		<ol>
			{#if khatm.rangeType === 'free'}
				<li class:ui-khatm-wizard-step-active={step >= 1}>
					{#if step > 1}
						<button type="button" onclick={() => goToStep(1)}>
							<span>۱</span><b>اندازه سهم</b>
						</button>
					{:else}
						<span aria-current="step"><i>۱</i><b>اندازه سهم</b></span>
					{/if}
				</li>
			{/if}
			<li class:ui-khatm-wizard-step-active={step >= (khatm.rangeType === 'free' ? 2 : 1)}>
				<span aria-current={step === (khatm.rangeType === 'free' ? 2 : 1) ? 'step' : undefined}>
					<i>{khatm.rangeType === 'free' ? '۲' : '۱'}</i><b>انتخاب بازه</b>
				</span>
			</li>
			<li class:ui-khatm-wizard-step-active={step >= (khatm.rangeType === 'free' ? 3 : 2)}>
				<span aria-current={step === (khatm.rangeType === 'free' ? 3 : 2) ? 'step' : undefined}>
					<i>{khatm.rangeType === 'free' ? '۳' : '۲'}</i><b>شروع قرائت</b>
				</span>
			</li>
		</ol>
	</nav>

	<div class="ui-khatm-wizard-body">
		{#if khatm.rangeType === 'free'}
			{#if step === 1}{@render stepSelectRangeType()}{/if}
			{#if step === 2}{@render stepSelectRange()}{/if}
			{#if step === 3 && selected}{@render stepShowResult(selected)}{/if}
		{:else}
			{#if step === 1}{@render stepSelectRange()}{/if}
			{#if step === 2 && selected}{@render stepShowResult(selected)}{/if}
		{/if}
	</div>
</section>

<Modal bind:open={() => modal, toggleModal} contentClass="ui-khatm-wizard-dialog">
	{#if selectionMode === 'subrange' && selected}
		<IncompleteRangePicker
			{khatm}
			{participation}
			parts={rawParts}
			range={selected}
			onClose={closeModal}
			onFinished={finishSubrange}
		/>
	{:else}
		<ConfirmRange {khatm} onClose={closeModal} onFinished={closeModalAndNext} range={selected} />
	{/if}
</Modal>
