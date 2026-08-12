<script lang="ts">
	import { onMount } from 'svelte'
	import type { ReviewStatus } from '@prisma-client'
	import AdminNav from '$lib/components/AdminNav.svelte'
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import Tab from '$lib/components/Tab.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import {
		featuredKhatm_getList,
		featuredKhatm_reorder,
		featuredKhatm_set,
		type FeaturedKhatmItem,
	} from '$lib/entity/KhatmFeatured'
	import { watch } from '$lib/hooks/watch.svelte'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconDown from '~icons/ic/round-keyboard-arrow-down'
	import IconEmpty from '~icons/ic/round-check-circle'
	import IconLink from '~icons/ic/round-link'
	import IconPending from '~icons/ic/outline-pending'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconReview from '~icons/ic/outline-check-box'
	import IconStar from '~icons/ic/round-star'
	import IconStarOutline from '~icons/ic/round-star-border'
	import IconUp from '~icons/ic/round-keyboard-arrow-up'

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
	let loadError = $state('')
	let updatingIds = $state<number[]>([])
	let loadRequestId = 0
	const featuredFull = $derived(featuredItems.length >= 6)

	const statusCopy = $derived(
		{
			pending: {
				title: 'در انتظار بررسی',
				description: 'ختم‌های تازه‌ای که هنوز درباره انتشار آن‌ها تصمیم نگرفته‌اید.',
				empty: 'صف بررسی خالی است؛ همه درخواست‌های تازه رسیدگی شده‌اند.',
			},
			approved: {
				title: 'تأییدشده‌ها',
				description: 'ختم‌هایی که برای نمایش عمومی تأیید شده‌اند.',
				empty: 'هنوز ختم تأییدشده‌ای در این فهرست وجود ندارد.',
			},
			rejected: {
				title: 'ردشده‌ها',
				description: 'ختم‌هایی که در بررسی مدیریت رد شده‌اند.',
				empty: 'هنوز ختم ردشده‌ای در این فهرست وجود ندارد.',
			},
		}[reviewStatus],
	)

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

	async function loadPage(force = false) {
		if ((loading && !force) || lastPage) return
		const requestId = ++loadRequestId
		const currentTab = reviewStatus
		loading = true
		loadError = ''
		try {
			const list = await Khatm.getAdminList({
				pageID: khatms.at(-1)?.khatm.id,
				reviewStatus,
			})
			if (currentTab !== reviewStatus || requestId !== loadRequestId) return
			if (list.length === 0) lastPage = true
			khatms = [...khatms, ...list]
		} catch (cause) {
			if (requestId !== loadRequestId) return
			console.error(cause)
			loadError = 'دریافت فهرست با خطا روبه‌رو شد. دوباره تلاش کنید.'
		} finally {
			if (requestId === loadRequestId) loading = false
		}
	}

	function nextPage() {
		return loadPage()
	}

	onMount(() => {
		nextPage()
		loadFeatured()
	})

	async function updateStatus(item: ReviewItem, nextStatus: ReviewStatus) {
		if (updatingIds.includes(item.khatm.id)) return
		updatingIds = [...updatingIds, item.khatm.id]
		try {
			await item.khatm.update({ reviewStatus: nextStatus })
			khatms = khatms.filter((current) => current.khatm.id !== item.khatm.id)
			if (nextStatus === 'rejected') await loadFeatured()
			toast('info', nextStatus === 'approved' ? 'ختم با موفقیت تأیید شد.' : 'ختم رد شد.')
		} catch (cause) {
			console.error(cause)
			toast('error', 'ثبت نتیجه بررسی انجام نشد. دوباره تلاش کنید.')
		} finally {
			updatingIds = updatingIds.filter((id) => id !== item.khatm.id)
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
			loadError = ''
			khatms = []
			loadPage(true)
		},
	)
</script>

<svelte:head>
	<title>ختم قرآن | بررسی ختم‌ها</title>
</svelte:head>

<Header title="بررسی ختم‌ها" />

<div class="ui-admin-shell">
	<AdminNav />

	<section class="ui-admin-page-heading" aria-labelledby="review-page-title">
		<span class="ui-admin-page-icon"><IconReview /></span>
		<div>
			<span>نظارت بر محتوای عمومی</span>
			<h1 id="review-page-title">بررسی و انتشار ختم‌ها</h1>
			<p>درخواست‌ها را ببینید و با یک تصمیم روشن، وضعیت انتشار آن‌ها را مشخص کنید.</p>
		</div>
	</section>

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

	<section class="ui-admin-review-panel" aria-labelledby="review-list-title">
		<div class="ui-admin-review-toolbar">
			<Tab
				tabs={[
					{
						slug: 'pending' satisfies ReviewStatus,
						icon: IconPending,
						title: 'منتظر بررسی',
					},
					{
						slug: 'approved' satisfies ReviewStatus,
						icon: IconApproved,
						title: 'تأییدشده',
					},
					{
						slug: 'rejected' satisfies ReviewStatus,
						icon: IconRejected,
						title: 'ردشده',
					},
				]}
				bind:value={reviewStatus}
			/>
		</div>

		<div class="ui-admin-review-heading">
			<div>
				<span class="ui-admin-status-dot ui-admin-status-dot-{reviewStatus}"></span>
				<div>
					<h2 id="review-list-title">{statusCopy.title}</h2>
					<p>{statusCopy.description}</p>
				</div>
			</div>
			{#if khatms.length > 0}
				<span class="ui-badge ui-badge-outline">{khatms.length.toLocaleString('fa')} مورد</span>
			{/if}
		</div>

		<div class="ui-admin-review-content" aria-live="polite" aria-busy={loading}>
			{#if khatms.length > 0}
				<ul class="ui-khatm-card-list">
					{#each khatms as item (item.khatm.id)}
						<li class:ui-admin-review-item-loading={updatingIds.includes(item.khatm.id)}>
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
										class="ui-btn ui-btn-sm ui-btn-icon ui-btn-ghost"
										href={getAdminDetailLink(item.khatm)}
										target="_blank"
										rel="noreferrer"
										aria-label={`مشاهده ختم ${item.khatm.title}`}
									><IconLink /></a>
									{#if item.canFeature && item.khatm.reviewStatus === 'approved'}
										<button
											class={[
												'ui-btn ui-btn-sm ui-btn-icon',
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
											class="ui-btn ui-btn-sm ui-btn-icon ui-admin-btn-reject"
											type="button"
											disabled={updatingIds.includes(item.khatm.id)}
											aria-label={`رد کردن ختم ${item.khatm.title}`}
											onclick={() => updateStatus(item, 'rejected')}
										>
											<IconRejected />
										</button>
									{/if}
									{#if item.khatm.reviewStatus === 'pending' || item.khatm.reviewStatus === 'rejected'}
										<button
											class="ui-btn ui-btn-sm ui-btn-icon ui-admin-btn-approve"
											type="button"
											disabled={updatingIds.includes(item.khatm.id)}
											aria-label={`تأیید ختم ${item.khatm.title}`}
											onclick={() => updateStatus(item, 'approved')}
										>
											<IconApproved />
										</button>
									{/if}
								{/snippet}
							</KhatmListCard>
						</li>
					{/each}
				</ul>
			{:else if loading}
				<div class="ui-admin-loading-state">
					<span class="ui-spinner ui-spinner-md"></span>
					<strong>در حال دریافت ختم‌ها…</strong>
					<small>چند لحظه صبر کنید.</small>
				</div>
			{:else if loadError}
				<div class="ui-admin-empty-state ui-admin-error-state">
					<span class="ui-admin-empty-icon"><IconRejected /></span>
					<strong>ارتباط برقرار نشد</strong>
					<p>{loadError}</p>
					<button class="ui-btn ui-btn-outline ui-btn-sm" type="button" onclick={nextPage}>
						تلاش دوباره
					</button>
				</div>
			{:else}
				<div class="ui-admin-empty-state">
					<span class="ui-admin-empty-icon"><IconEmpty /></span>
					<strong>موردی برای نمایش نیست</strong>
					<p>{statusCopy.empty}</p>
				</div>
			{/if}

			{#if khatms.length > 0 && !lastPage}
				<button
					class="ui-btn ui-btn-soft ui-admin-load-more"
					type="button"
					onclick={nextPage}
					disabled={loading}
				>
					{#if loading}<span class="ui-spinner"></span>{/if}
					{loading ? 'در حال بارگیری…' : 'نمایش موارد بیشتر'}
				</button>
			{/if}
		</div>
	</section>
</div>

<style>
	.admin-featured-panel {
		margin-top: 1rem;
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
