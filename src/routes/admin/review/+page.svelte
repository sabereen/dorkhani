<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import {
		featuredKhatm_getList,
		featuredKhatm_reorder,
		featuredKhatm_set,
		type FeaturedKhatmItem,
	} from '$lib/entity/KhatmFeatured'
	import { watch } from '$lib/hooks/watch.svelte'
	import Tab from '$lib/components/Tab.svelte'
	import type { ReviewStatus } from '@prisma-client'
	import { onMount } from 'svelte'
	import IconPending from '~icons/ic/outline-pending'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconLink from '~icons/ic/round-link'
	import IconStar from '~icons/ic/round-star'
	import IconStarOutline from '~icons/ic/round-star-border'
	import IconUp from '~icons/ic/round-keyboard-arrow-up'
	import IconDown from '~icons/ic/round-keyboard-arrow-down'

	type ReviewItem = {
		khatm: Khatm
		featuredOrder: number | null
		canFeature: boolean
	}
	type SelectedItem = { khatm: Khatm; featuredOrder: number }

	let khatms = $state<ReviewItem[]>([])
	let featuredItems = $state<SelectedItem[]>([])
	let reviewStatus: ReviewStatus = $state('pending')
	let lastPage = $state(false)
	let loading = $state(false)
	let featuredLoading = $state(true)
	let featuredAction = $state<string | null>(null)
	let featuredMessage = $state('')
	const featuredFull = $derived(featuredItems.length >= 6)

	function getErrorMessage(cause: unknown) {
		if (
			cause &&
			typeof cause === 'object' &&
			'message' in cause &&
			typeof cause.message === 'string'
		) {
			return cause.message
		}
		return 'تغییر فهرست ختم‌های شاخص انجام نشد. دوباره تلاش کنید.'
	}

	function applyFeaturedItems(items: FeaturedKhatmItem[]) {
		featuredItems = items.map((item) => ({
			khatm: Khatm.fromPlain(item.khatm),
			featuredOrder: item.featuredOrder,
		}))
		const orderBySeriesId = new Map(
			items.map((item) => [item.khatm.seriesId, item.featuredOrder]),
		)
		for (const item of khatms) {
			item.featuredOrder =
				item.khatm.status === 'inProgress'
					? (orderBySeriesId.get(item.khatm.seriesId) ?? null)
					: null
		}
	}

	async function loadFeatured() {
		featuredLoading = true
		try {
			const { items } = await featuredKhatm_getList()
			applyFeaturedItems(items)
		} catch (cause) {
			featuredMessage = getErrorMessage(cause)
		} finally {
			featuredLoading = false
		}
	}

	async function nextPage() {
		const currentTab = reviewStatus
		loading = true
		try {
			const list = await Khatm.getAdminList({
				pageID: khatms.at(-1)?.khatm.id,
				reviewStatus,
			})
			if (currentTab !== reviewStatus) return
			if (list.length === 0) lastPage = true
			khatms = [...khatms, ...list]
		} catch (cause) {
			toast('error', getErrorMessage(cause))
		} finally {
			loading = false
		}
	}

	onMount(() => {
		nextPage()
		loadFeatured()
	})

	async function approve(item: ReviewItem) {
		try {
			await item.khatm.update({ reviewStatus: 'approved' })
			toast('info', 'ختم تأیید شد.')
		} catch (cause) {
			toast('error', getErrorMessage(cause))
		}
	}

	async function reject(item: ReviewItem) {
		try {
			await item.khatm.update({ reviewStatus: 'rejected' })
			item.featuredOrder = null
			await loadFeatured()
			toast('info', 'ختم رد شد.')
		} catch (cause) {
			toast('error', getErrorMessage(cause))
		}
	}

	async function setFeatured(item: ReviewItem | SelectedItem, featured: boolean) {
		if (featuredAction) return
		featuredAction = `${featured ? 'add' : 'remove'}-${item.khatm.id}`
		featuredMessage = ''
		try {
			const { items } = await featuredKhatm_set(item.khatm.id, featured)
			applyFeaturedItems(items)
			featuredMessage = featured
				? 'ختم به فهرست شاخص‌ها افزوده شد.'
				: 'ختم از فهرست شاخص‌ها حذف شد.'
			toast('info', featuredMessage)
		} catch (cause) {
			featuredMessage = getErrorMessage(cause)
			toast('error', featuredMessage)
		} finally {
			featuredAction = null
		}
	}

	async function moveFeatured(index: number, direction: -1 | 1) {
		const targetIndex = index + direction
		if (featuredAction || targetIndex < 0 || targetIndex >= featuredItems.length) return
		const reordered = [...featuredItems]
		const [moved] = reordered.splice(index, 1)
		reordered.splice(targetIndex, 0, moved)
		featuredAction = 'reorder'
		featuredMessage = ''
		try {
			const { items } = await featuredKhatm_reorder(
				reordered.map((item) => item.khatm.seriesId!),
			)
			applyFeaturedItems(items)
			featuredMessage = 'ترتیب ختم‌های شاخص ذخیره شد.'
		} catch (cause) {
			featuredMessage = getErrorMessage(cause)
			toast('error', featuredMessage)
		} finally {
			featuredAction = null
		}
	}

	function getAdminDetailLink(khatm: Khatm) {
		const url = new URL(khatm.link)
		url.searchParams.set('admin', '1')
		return url.toString()
	}

	watch(
		() => reviewStatus,
		() => {
			lastPage = false
			khatms = []
			nextPage()
		},
	)
</script>

<svelte:head>
	<title>ختم قرآن | تأیید و رد</title>
</svelte:head>

<Header title="تأیید و رد ختم ها" />

<section class="ui-card ui-card-bordered admin-featured-panel" aria-labelledby="admin-featured-title">
	<div class="ui-card-body">
		<div class="admin-featured-heading">
			<div>
				<span class="admin-featured-kicker"><IconStar /> ویترین دائمی صفحهٔ اصلی</span>
				<h2 id="admin-featured-title" class="ui-card-title">ختم‌های شاخص</h2>
				<p>حداکثر شش ختم عمومی و نامحدود را انتخاب و ترتیب نمایش آن‌ها را مشخص کنید.</p>
			</div>
			<span class="ui-badge ui-badge-info">
				{featuredItems.length.toLocaleString('fa')} از ۶
			</span>
		</div>

		{#if featuredLoading}
			<div class="admin-featured-loading" role="status">
				<span class="ui-spinner"></span>
				در حال دریافت ختم‌های شاخص…
			</div>
		{:else if featuredItems.length === 0}
			<div class="ui-alert ui-alert-info">
				<IconStarOutline />
				<span>هنوز ختمی انتخاب نشده است؛ از زبانهٔ «تأیید شده» یک ختم دائمی را برگزینید.</span>
			</div>
		{:else}
			<ol class="ui-khatm-card-list admin-featured-list">
				{#each featuredItems as item, index (item.khatm.id)}
					<li>
						<KhatmListCard
							khatm={item.khatm}
							meta={`جایگاه ${item.featuredOrder.toLocaleString('fa')}`}
							showDescription
						>
							{#snippet actions()}
								<button
									class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
									type="button"
									disabled={Boolean(featuredAction) || index === 0}
									aria-label={`انتقال ${item.khatm.title} به جایگاه بالاتر`}
									onclick={() => moveFeatured(index, -1)}
								>
									<IconUp />
								</button>
								<button
									class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
									type="button"
									disabled={Boolean(featuredAction) || index === featuredItems.length - 1}
									aria-label={`انتقال ${item.khatm.title} به جایگاه پایین‌تر`}
									onclick={() => moveFeatured(index, 1)}
								>
									<IconDown />
								</button>
								<button
									class="ui-btn ui-btn-xs ui-btn-icon ui-btn-outline"
									type="button"
									disabled={Boolean(featuredAction)}
									aria-label={`حذف ${item.khatm.title} از ختم‌های شاخص`}
									onclick={() => setFeatured(item, false)}
								>
									<IconStarOutline />
								</button>
							{/snippet}
						</KhatmListCard>
					</li>
				{/each}
			</ol>
		{/if}

		<p class="admin-featured-message" aria-live="polite">{featuredMessage}</p>
	</div>
</section>

{#snippet khatmItem(item: ReviewItem)}
	<KhatmListCard
		khatm={item.khatm}
		meta={item.khatm.reviewStatus === 'approved'
			? 'تأییدشده'
			: item.khatm.reviewStatus === 'rejected'
				? 'ردشده'
				: 'منتظر بررسی'}
		showDescription
	>
		{#snippet actions()}
			<a
				class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
				href={getAdminDetailLink(item.khatm)}
				target="_blank"
				aria-label={`مشاهده ختم ${item.khatm.title}`}><IconLink /></a
			>
			{#if item.canFeature && item.khatm.reviewStatus === 'approved'}
				<button
					class={[
						'ui-btn ui-btn-xs ui-btn-icon',
						item.featuredOrder != null ? 'ui-btn-secondary' : 'ui-btn-ghost',
					]}
					type="button"
					disabled={Boolean(featuredAction) || (featuredFull && item.featuredOrder == null)}
					aria-label={item.featuredOrder == null
						? 'افزودن به ختم‌های شاخص'
						: 'حذف از ختم‌های شاخص'}
					onclick={() => setFeatured(item, item.featuredOrder == null)}
				>
					{#if item.featuredOrder != null}<IconStar />{:else}<IconStarOutline />{/if}
				</button>
			{/if}
			{#if item.khatm.reviewStatus === 'pending' || item.khatm.reviewStatus === 'approved'}
				<button
					class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
					type="button"
					aria-label="رد کردن ختم"
					onclick={() => reject(item)}
				>
					<IconRejected class="text-red-500" />
				</button>
			{/if}
			{#if item.khatm.reviewStatus === 'pending' || item.khatm.reviewStatus === 'rejected'}
				<button
					class="ui-btn ui-btn-xs ui-btn-icon ui-btn-ghost"
					type="button"
					aria-label="تأیید ختم"
					onclick={() => approve(item)}
				>
					<IconApproved class="text-green-500" />
				</button>
			{/if}
		{/snippet}
	</KhatmListCard>
{/snippet}

<div class="ui-bg-muted rounded-b px-2 pb-2 text-sm shadow-sm">
	<Tab
		tabs={[
			{
				slug: 'pending' satisfies ReviewStatus,
				icon: IconPending,
				title: 'منتظر تأیید',
			},
			{
				slug: 'approved' satisfies ReviewStatus,
				icon: IconApproved,
				title: 'تأیید شده',
			},
			{
				slug: 'rejected' satisfies ReviewStatus,
				icon: IconRejected,
				title: 'رد شده',
			},
		]}
		bind:value={reviewStatus}
	/>
</div>

<section class="ui-card ui-card-bordered ui-bg-muted mt-4">
	<div class="ui-card-body">
		<h2 class="ui-card-title">آخرین ختم‌های عمومی</h2>
		<ul class="ui-khatm-card-list">
			{#each khatms as item (item.khatm.id)}
				<li>
					{@render khatmItem(item)}
				</li>
			{/each}
		</ul>
		{#if !lastPage}
			<button class="ui-btn" onclick={nextPage} disabled={loading}> بارگیری موارد بعدی </button>
		{/if}
	</div>
</section>

<style>
	.admin-featured-panel {
		margin: 1rem 0;
		border-color: var(--ui-color-border-strong);
		background: linear-gradient(145deg, var(--ui-color-warning-soft), var(--ui-color-surface) 18rem);
	}

	.admin-featured-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.admin-featured-heading > * + * {
		margin-right: 1rem;
	}

	.admin-featured-kicker {
		display: flex;
		align-items: center;
		color: var(--ui-color-warning);
		font-size: 0.76rem;
		font-weight: 900;
	}

	.admin-featured-kicker svg {
		width: 1rem;
		height: 1rem;
		margin-left: 0.35rem;
	}

	.admin-featured-heading h2 {
		margin-top: 0.35rem;
	}

	.admin-featured-heading p,
	.admin-featured-message {
		color: var(--ui-color-text-muted);
		font-size: 0.82rem;
	}

	.admin-featured-heading p {
		margin: 0.3rem 0 0;
	}

	.admin-featured-list {
		margin-top: 1rem;
	}

	.admin-featured-loading {
		display: flex;
		align-items: center;
		min-height: 4rem;
		color: var(--ui-color-text-muted);
	}

	.admin-featured-loading > * + * {
		margin-right: 0.5rem;
	}

	.admin-featured-message {
		min-height: 1.25rem;
		margin: 0.75rem 0 0;
	}
</style>
