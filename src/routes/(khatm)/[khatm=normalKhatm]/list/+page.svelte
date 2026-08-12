<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Juz } from '@ghoran/entity'
	import { juz_toRange } from '$lib/entity/Juz'
	import { QuranRange } from '$lib/entity/Range'
	import IconEye from '~icons/ic/outline-remove-red-eye'
	import IconList from '~icons/ic/round-format-list-bulleted'
	import IconSearch from '~icons/ic/round-search'
	import IconExpand from '~icons/ic/round-expand-more'
	import IconBook from '~icons/ic/round-auto-stories'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconRadio from '~icons/ic/round-radio-button-unchecked'
	import IconPerson from '~icons/ic/round-person'
	import IconTune from '~icons/ic/round-tune'
	import ConfirmRange from '../confirm-range.svelte'
	import { useKathmContext } from '../../khatm-context.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import Tab from '$lib/components/Tab.svelte'
	import Accardeon from '$lib/components/Accardeon.svelte'
	import PickedRangeResult from '../PickedRangeResult.svelte'

	type PageState = {
		modal?: boolean
	}
	type SubrangeType = 'hizbQuarter' | 'surah' | 'page'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const rawParts = $derived(khatmContext.rawParts)
	const participation = $derived(khatm.participation)

	let hideFinishedIntervals = $state(true)
	let juzQuery = $state('')
	let subrangeType = $state<SubrangeType>(
		khatm.rangeType === 'hizbQuarter' || khatm.rangeType === 'page' || khatm.rangeType === 'surah'
			? khatm.rangeType
			: 'surah',
	)

	const juzRanges = Juz.getAll().map(juz_toRange)
	const availableJuzCount = $derived(
		juzRanges.filter((range) => range.getFillPercent(parts) < 100).length,
	)
	const myJuzCount = $derived(
		juzRanges.filter((range) => participation.getOverlapLength(range) > 0).length,
	)

	function normalizeQuery(value: string) {
		return value
			.trim()
			.toLocaleLowerCase('fa')
			.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
			.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
			.replace(/ي/g, 'ی')
			.replace(/ك/g, 'ک')
	}

	const visibleJuzRanges = $derived.by(() => {
		const query = normalizeQuery(juzQuery)
		return juzRanges.filter((range) => {
			if (hideFinishedIntervals && range.getFillPercent(parts) >= 100) return false
			if (!query) return true
			return normalizeQuery(range.title).includes(query)
		})
	})

	let openedAccardeon = $state(-1)
	const accardeonRange = $derived(visibleJuzRanges[openedAccardeon])
	const accardeonSubranges = $derived(
		{
			surah: accardeonRange?.getSurahs.bind(accardeonRange),
			page: accardeonRange?.getPages.bind(accardeonRange),
			hizbQuarter: accardeonRange?.getHizbQuarters.bind(accardeonRange),
		}[subrangeType]?.(),
	)
	const accardeonDevidedRanges = $derived.by(() => {
		let list =
			accardeonSubranges?.map((item) => ({
				...item,
				parts: item.range.divideByKahtmParts(rawParts),
			})) || []

		if (hideFinishedIntervals) {
			list.forEach((item) => {
				item.parts = item.parts.filter((part) => !part.khatmPart)
			})
			list = list.filter(({ parts: dividedParts }) => dividedParts.length > 0)
		}
		return list
	})

	const modal = $derived(!!(page.state as PageState).modal)
	let selected = $state(new QuranRange(0, 0))
	let picked = $state(false)

	function resetOpenedJuz() {
		openedAccardeon = -1
	}

	function clearSearch() {
		juzQuery = ''
		resetOpenedJuz()
	}

	function openModal(range: QuranRange) {
		if (modal) return

		if (!range.matchRangeType(khatm.rangeType)) {
			toast(
				'error',
				`این ختم بر اساس ${khatm.rangeTypeTitle} تقسیم شده و این بازه قابل انتخاب نیست.`,
			)
			return
		}
		selected = range
		picked = false
		pushState('', { modal: true } satisfies PageState)
	}

	function closeModal() {
		if (modal) history.back()
	}
</script>

<section class="ui-khatm-browser" aria-labelledby="khatm-list-title">
	<header class="ui-khatm-browser-hero">
		<div class="ui-khatm-browser-heading">
			<span class="ui-khatm-browser-heading-icon"><IconList /></span>
			<div>
				<span class="ui-khatm-wizard-kicker">مرور جزء‌به‌جزء قرآن</span>
				<h2 id="khatm-list-title">سهمتان را با جزئیات پیدا کنید</h2>
				<p>
					هر جزء را باز کنید، شیوه تقسیم‌بندی را تغییر دهید و وضعیت تمام بخش‌ها را یک‌جا ببینید.
				</p>
			</div>
		</div>

		<div class="ui-khatm-browser-stats" aria-label="خلاصه وضعیت فهرست">
			<div><strong>{khatm.percent.toLocaleString('fa')}٪</strong><span>پیشرفت ختم</span></div>
			<div>
				<strong>{availableJuzCount.toLocaleString('fa')}</strong><span>جزء دارای بخش آزاد</span>
			</div>
			<div><strong>{myJuzCount.toLocaleString('fa')}</strong><span>جزء شامل سهم شما</span></div>
		</div>
	</header>

	<div class="ui-khatm-browser-controls">
		<div class="ui-khatm-browser-search">
			<label for="juz-search">رفتن به جزء</label>
			<div>
				<IconSearch aria-hidden="true" />
				<input
					id="juz-search"
					class="ui-input"
					type="search"
					placeholder="مثلاً جزء ۱۲"
					bind:value={juzQuery}
					oninput={resetOpenedJuz}
				/>
				{#if juzQuery}
					<button type="button" class="ui-btn ui-btn-ghost ui-btn-xs" onclick={clearSearch}
						>پاک‌کردن</button
					>
				{/if}
			</div>
		</div>
		<label class="ui-khatm-browser-filter">
			<span class="ui-khatm-browser-filter-icon"><IconTune /></span>
			<span><strong>فقط جزءهای دارای ظرفیت</strong><small>جزءهای تکمیل‌شده پنهان شوند</small></span>
			<input
				type="checkbox"
				class="ui-checkbox"
				bind:checked={hideFinishedIntervals}
				onchange={resetOpenedJuz}
			/>
		</label>
	</div>

	<div class="ui-khatm-browser-legend" aria-label="راهنمای وضعیت بخش‌ها">
		<span><i class="ui-khatm-browser-key ui-khatm-browser-key-free"></i>آزاد و قابل انتخاب</span>
		<span><i class="ui-khatm-browser-key ui-khatm-browser-key-picked"></i>برداشته‌شده</span>
		<span><i class="ui-khatm-browser-key ui-khatm-browser-key-mine"></i>سهم شما</span>
	</div>

	{#if visibleJuzRanges.length > 0}
		<div class="ui-khatm-browser-accordion">
			<Accardeon items={visibleJuzRanges} bind:selectedIndex={openedAccardeon}>
				{#snippet title(range, index, expanded)}
					{@const percent = range.getFillPercent(parts)}
					{@const juzNumber = juzRanges.indexOf(range) + 1}
					{@const mine = participation.getOverlapLength(range) > 0}
					<div
						class="ui-khatm-browser-juz"
						data-range-index={index}
						class:ui-khatm-browser-juz-open={expanded}
						class:ui-khatm-browser-juz-finished={percent >= 100}
					>
						<span class="ui-khatm-browser-juz-number">{juzNumber.toLocaleString('fa')}</span>
						<span class="ui-khatm-browser-juz-main">
							<span class="ui-khatm-browser-juz-title">
								<strong>{range.title}</strong>
								{#if mine}<span class="ui-badge ui-badge-accent ui-badge-xs">شامل سهم شما</span
									>{/if}
								{#if percent >= 100}<span class="ui-badge ui-badge-neutral ui-badge-xs"
										>تکمیل‌شده</span
									>{/if}
							</span>
							<span class="ui-khatm-browser-juz-progress">
								<progress
									class="ui-progress"
									max={100}
									value={percent}
									aria-label={`پیشرفت ${range.title}`}
								></progress>
								<small><b>{percent.toLocaleString('fa')}٪</b> انتخاب شده</small>
							</span>
						</span>
						<span class="ui-khatm-browser-juz-action">
							<span>
								{expanded ? 'بستن جزئیات' : percent >= 100 ? 'مشاهده جزئیات' : 'دیدن بخش‌ها'}
							</span>
							<IconExpand aria-hidden="true" />
						</span>
					</div>
				{/snippet}

				{#snippet content(range)}
					{@const juzPercent = range.getFillPercent(parts)}
					<div class="ui-khatm-browser-content">
						<div class="ui-khatm-browser-content-head">
							<div>
								<span>جزئیات {range.title}</span>
								<strong>
									{juzPercent >= 100
										? 'همه بخش‌های این جزء برداشته شده‌اند'
										: 'بخش‌های سبزرنگ هنوز آزاد هستند'}
								</strong>
							</div>
							{#if juzPercent === 0 && range.matchRangeType(khatm.rangeType)}
								<button
									type="button"
									class="ui-btn ui-btn-primary ui-btn-sm"
									onclick={() => openModal(range)}
								>
									انتخاب کامل {range.title}
								</button>
							{/if}
						</div>

						<div class="ui-khatm-browser-view-control">
							<div>
								<IconBook />
								<span>
									<strong>تقسیم‌بندی بخش‌ها</strong>
									<small>نمای مناسب برای مرور را انتخاب کنید</small>
								</span>
							</div>
							<div class="ui-khatm-browser-tabs">
								<Tab
									tabs={[
										{ title: 'ربع حزب', slug: 'hizbQuarter' },
										{ title: 'صفحه', slug: 'page' },
										{ title: 'سوره', slug: 'surah' },
									]}
									bind:value={subrangeType}
								/>
							</div>
						</div>

						{#if accardeonDevidedRanges.length > 0}
							<ul class="ui-khatm-browser-groups">
								{#each accardeonDevidedRanges as { parts: dividedParts, range: subrange }}
									{@const percent = subrange.getFillPercent(parts)}
									<li class="ui-khatm-browser-group">
										<header>
											<div>
												<strong>{subrange.title}</strong>
												<span>{percent.toLocaleString('fa')}٪ انتخاب شده</span>
											</div>
											<progress
												class="ui-progress"
												max={100}
												value={percent}
												aria-label={`پیشرفت ${subrange.title}`}
											></progress>
										</header>
										<ul class="ui-khatm-browser-parts">
											{#each dividedParts as { khatmPart, range: part }}
												{@const mine = !!khatmPart && participation.isMine(part)}
												{@const canSelect = !khatmPart && part.matchRangeType(khatm.rangeType)}
												<li
													class:ui-khatm-browser-part-free={canSelect}
													class:ui-khatm-browser-part-view={!khatmPart && !canSelect}
													class:ui-khatm-browser-part-picked={!!khatmPart && !mine}
													class:ui-khatm-browser-part-mine={mine}
												>
													<span class="ui-khatm-browser-part-state">
														{#if mine}<IconPerson />{:else if khatmPart}<IconCheck
															/>{:else}<IconRadio />{/if}
													</span>
													<div class="ui-khatm-browser-part-copy">
														<strong>{part.getTitleSurahOrinted()}</strong>
														<span>
															{mine
																? 'این بخش سهم شماست'
																: khatmPart
																	? 'این بخش پیش‌تر برداشته شده است'
																	: canSelect
																		? 'آزاد و آماده انتخاب'
																		: `این ختم فقط با بازه ${khatm.rangeTypeTitle} انتخاب می‌شود`}
														</span>
													</div>
													<div class="ui-khatm-browser-part-actions">
														{#if canSelect}
															<button
																type="button"
																class="ui-btn ui-btn-primary ui-btn-sm"
																onclick={() => openModal(part)}
															>
																انتخاب این بخش
															</button>
														{/if}
														<a
															class="ui-btn ui-btn-icon ui-btn-ghost ui-btn-sm"
															aria-label={`مشاهده ${part.getTitleSurahOrinted()}`}
															target="_blank"
															rel="noreferrer"
															href={part.getLink(khatm)}><IconEye /></a
														>
													</div>
												</li>
											{/each}
										</ul>
									</li>
								{/each}
							</ul>
						{:else}
							<div class="ui-khatm-browser-empty">
								<IconCheck />
								<strong>بخش آزادی در این تقسیم‌بندی باقی نمانده است</strong>
								<span>فیلتر جزءهای تکمیل‌شده را خاموش کنید تا همه جزئیات نمایش داده شوند.</span>
							</div>
						{/if}
					</div>
				{/snippet}
			</Accardeon>
		</div>
	{:else}
		<div class="ui-khatm-browser-empty ui-khatm-browser-empty-page">
			<IconSearch />
			<strong>{juzQuery ? 'جزئی با این شماره پیدا نشد' : 'همه جزءها تکمیل شده‌اند'}</strong>
			<span
				>{juzQuery
					? 'شماره دیگری را جست‌وجو کنید.'
					: 'برای مرور نتیجه، فیلتر جزءهای دارای ظرفیت را خاموش کنید.'}</span
			>
			{#if juzQuery}<button type="button" class="ui-btn ui-btn-soft" onclick={clearSearch}
					>پاک‌کردن جست‌وجو</button
				>{/if}
		</div>
	{/if}
</section>

<Modal bind:open={() => modal, closeModal} contentClass="ui-khatm-wizard-dialog">
	{#if picked}
		<PickedRangeResult {khatm} onClose={closeModal} range={selected} />
	{:else}
		<ConfirmRange
			{khatm}
			onClose={closeModal}
			onFinished={() => (picked = true)}
			range={selected}
		/>
	{/if}
</Modal>
