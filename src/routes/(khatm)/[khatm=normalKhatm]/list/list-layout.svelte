<script lang="ts" module>
	import { KhatmPart } from '$lib/entity/KhatmPart'
	import type { Khatm } from '$lib/entity/Khatm.svelte'

	export type Props = {
		parts: KhatmPart[]
		khatm: Khatm
		grid?: boolean
		onFinished?: () => void
	}
</script>

<script lang="ts">
	import Modal from '$lib/components/Modal.svelte'
	import { Juz } from '@ghoran/entity'
	import { juz_toRange } from '$lib/entity/Juz'
	import { QuranRange } from '$lib/entity/Range'
	import IconEye from '~icons/ic/outline-remove-red-eye'
	import ConfirmRange from '../confirm-range.svelte'

	const props: Props = $props()

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
				parts: item.range.divideByKahtmParts(props.parts),
			})) || []

		if (hideFinishedIntervals) {
			list.forEach((item) => {
				item.parts = item.parts.filter((p) => !p.khatmPart)
			})

			list = list.filter(({ parts }) => parts.length > 0)
		}
		return list
	})

	let modal = $state(false)

	let selected = $state(new QuranRange(0, 0))

	function openModal(start: number, end: number) {
		modal = true
		selected = new QuranRange(start, end)
	}
</script>

<div class="px-4">
	<label class="my-2 block">
		<input type="checkbox" class="checkbox" bind:checked={hideFinishedIntervals} />
		پنهان کردن بازه‌های قرائت شده
	</label>
</div>

<div class="join join-vertical bg-base-100 w-full">
	{#each juzRanges as range, i}
		{@const percent = range.getFillPercent(props.parts)}
		<div
			class="collapse-plus join-item bg-base-100 collapse border border-gray-500"
			class:hidden={hideFinishedIntervals && percent >= 100}
			class:opacity-50={percent >= 100}
			class:pointer-events-none={percent >= 100}
		>
			<input
				type="radio"
				name="juz"
				bind:group={openedAccardeon}
				value={i}
				disabled={percent >= 100}
			/>
			<div class="collapse-title font-semibold">
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
			<div class="collapse-content w-full text-xs sm:text-sm">
				{#if openedAccardeon === i}
					<!-- انتخاب نوع زیربازه -->
					<div class="tabs tabs-box justify-center">
						<input
							class="tab"
							type="radio"
							name="subrangeType"
							bind:group={subrangeType}
							value="hizbQuarter"
							aria-label="ربع حزب"
						/>
						<div class="tab-content">
							{#if subrangeType === 'hizbQuarter'}
								{@render tabContent()}
							{/if}
						</div>
						<input
							class="tab"
							type="radio"
							name="subrangeType"
							bind:group={subrangeType}
							value="surah"
							aria-label="سوره"
						/>
						<div class="tab-content">
							{#if subrangeType === 'surah'}
								{@render tabContent()}
							{/if}
						</div>
						<input
							class="tab"
							type="radio"
							name="subrangeType"
							bind:group={subrangeType}
							value="page"
							aria-label="صفحه"
						/>
						<div class="tab-content">
							{#if subrangeType === 'page'}
								{@render tabContent()}
							{/if}
						</div>
					</div>

					{#snippet tabContent()}
						<ul class="rounded-box py-2">
							{#each accardeonDevidedRanges as { parts, range }}
								{@const percent = range.getFillPercent(props.parts)}
								<li
									class="bg-base-100 flex items-center border border-gray-200 px-1 py-1 first:rounded-t last:rounded-b dark:border-gray-700"
								>
									<div class="ml-2 flex w-24 items-center">
										<span
											class="radial-progress text-primary ms-1 me-1 text-[0.5rem]"
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
														class="btn btn-primary btn-xs ms-auto"
														onclick={() => openModal(range.start, range.end)}
													>
														انتخاب
													</button>
												{/if}
												<a
													class="btn btn-circle btn-ghost btn-xs ms-1"
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
					{/snippet}
				{/if}
			</div>
		</div>
	{/each}
</div>

<Modal bind:open={modal}>
	<ConfirmRange khatm={props.khatm} onClose={() => (modal = false)} range={selected} />
</Modal>
