<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Juz } from '@ghoran/entity'
	import { juz_toRange } from '$lib/entity/Juz'
	import { QuranRange } from '$lib/entity/Range'
	import IconEye from '~icons/ic/outline-remove-red-eye'
	import ConfirmRange from '../confirm-range.svelte'
	import { useKathmContext } from '../../khatm-context.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { page } from '$app/state'
	import { pushState } from '$app/navigation'
	import Tab from '$lib/components/Tab.svelte'
	import Accardeon from '$lib/components/Accardeon.svelte'

	type PageState = {
		modal?: boolean
	}

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)

	let hideFinishedIntervals = $state(false)
	/** نوع زیربازه‌ها در چیدمان آکاردئونی */
	let subrangeType = $state<'hizbQuarter' | 'surah' | 'page'>('surah')

	const juzList = Juz.getAll()
	const juzRanges = juzList.map(juz_toRange)

	let openedAccardeon = $state(-1)
	let accardeonJuz = $derived(juzList[openedAccardeon] as Juz | undefined)
	let accardeonRange = $derived(accardeonJuz && juz_toRange(accardeonJuz))
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
				parts: item.range.divideByKahtmParts(parts),
			})) || []

		if (hideFinishedIntervals) {
			list.forEach((item) => {
				item.parts = item.parts.filter((p) => !p.khatmPart)
			})

			list = list.filter(({ parts }) => parts.length > 0)
		}
		return list
	})

	const modal = $derived(!!(page.state as PageState).modal)

	let selected = $state(new QuranRange(0, 0))

	function openModal(range: QuranRange) {
		if (modal) return

		if (!range.matchRangeType(khatm.rangeType)) {
			toast('error', `ختم جاری ${khatm.rangeTypeTitle} است و با این بازه هم‌خوانی ندارد.`)
			return
		}
		selected = range
		pushState('', { modal: true } satisfies PageState)
	}

	function closeModal() {
		if (modal) history.back()
	}
</script>

<div class="px-4">
	<label class="my-2 block">
		<input type="checkbox" class="checkbox" bind:checked={hideFinishedIntervals} />
		پنهان کردن بازه‌های قرائت شده
	</label>
</div>

<div class="bg-base-100">
	<Accardeon items={juzRanges} bind:selectedIndex={openedAccardeon}>
		{#snippet title(range)}
			{@const percent = range.getFillPercent(parts)}
			<div class="p-4 font-semibold" class:opacity-50={percent >= 100}>
				<span
					class="radial-progress text-primary ms-1 text-[0.6rem]"
					style:--value={percent}
					style:--size="1.4rem"
					aria-valuenow={percent}
					role="progressbar"
				>
					&lrm;{percent.toLocaleString('fa')}٪&lrm;
				</span>
				{range.title}
				{#if percent >= 100}
					<span class="badge badge-xs">قبلا قرائت شده است</span>
				{/if}
			</div>
		{/snippet}

		{#snippet content(range, i)}
			<div class="z-1 relative w-full px-4 pb-4 text-xs sm:text-sm">
				<!-- انتخاب نوع زیربازه -->
				<div class="bg-base-300 w-full rounded-xl p-2">
					<div class="mx-auto max-w-[270px] text-[13px]">
						<Tab
							tabs={[
								{ title: 'ربع حزب', slug: 'hizbQuarter' },
								{ title: 'صفحه', slug: 'page' },
								{ title: 'سوره', slug: 'surah' },
							]}
							bind:value={subrangeType}
						/>
					</div>

					<ul class="rounded-box py-2">
						{#each accardeonDevidedRanges as { parts, range }}
							{@const percent = range.getFillPercent(khatmContext.parts)}
							<li
								class="bg-base-100 flex items-center border px-1 py-1 first:rounded-t last:rounded-b"
							>
								<div class="ml-2 flex w-24 items-center">
									<span
										class="radial-progress text-primary me-1 ms-1 text-[0.5rem]"
										style:--value={percent}
										style:--size="1.4rem"
										aria-valuenow={percent}
										role="progressbar"
									>
										&lrm;{percent.toLocaleString('fa')}٪&lrm;
									</span>
									{range.title}
								</div>
								<div class="flex grow flex-col">
									{#each parts as { khatmPart, range }}
										<div class="flex items-center px-1 py-1">
											<span class:text-gray-500={!!khatmPart}>
												{range.getTitleSurahOrinted()}
											</span>
											<span class="m-3 h-0 grow border border-dashed border-gray-500/20"></span>
											{#if khatmPart}
												<span class="badge badge-xs opacity-75">قرائت‌شده</span>
											{:else}
												<button
													type="button"
													class="btn btn-primary btn-xs pointer-events-auto! ms-auto"
													class:btn-disabled={!range.matchRangeType(khatm.rangeType)}
													onclick={() => openModal(range)}
												>
													انتخاب
												</button>
											{/if}
											<a
												class="btn !btn-circle btn-ghost btn-xs ms-1"
												target="_blank"
												href={range.externalLink}
											>
												<IconEye />
											</a>
										</div>
									{/each}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/snippet}
	</Accardeon>
</div>

<Modal bind:open={() => modal, closeModal}>
	<ConfirmRange {khatm} onClose={closeModal} onFinished={closeModal} range={selected} />
</Modal>
