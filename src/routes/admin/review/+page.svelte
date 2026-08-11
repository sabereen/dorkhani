<script lang="ts">
	import { onMount } from 'svelte'
	import type { ReviewStatus } from '@prisma-client'
	import AdminNav from '$lib/components/AdminNav.svelte'
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import Tab from '$lib/components/Tab.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { watch } from '$lib/hooks/watch.svelte'
	import IconApproved from '~icons/ic/sharp-check-circle-outline'
	import IconEmpty from '~icons/ic/round-check-circle'
	import IconLink from '~icons/ic/round-link'
	import IconPending from '~icons/ic/outline-pending'
	import IconRejected from '~icons/ic/baseline-remove-circle-outline'
	import IconReview from '~icons/ic/outline-check-box'

	let khatms = $state<Khatm[]>([])
	let reviewStatus: ReviewStatus = $state('pending')
	let lastPage = $state(false)
	let loading = $state(false)
	let loadError = $state('')
	let updatingIds = $state<number[]>([])
	let loadRequestId = 0

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

	async function loadPage(force = false) {
		if ((loading && !force) || lastPage) return
		const requestId = ++loadRequestId
		const currentTab = reviewStatus
		loading = true
		loadError = ''
		try {
			const list = await Khatm.getList({ pageID: khatms.at(-1)?.id, reviewStatus })
			if (currentTab !== reviewStatus || requestId !== loadRequestId) return
			if (list.length === 0) lastPage = true
			khatms = [...khatms, ...list]
		} catch (err) {
			if (requestId !== loadRequestId) return
			console.error(err)
			loadError = 'دریافت فهرست با خطا روبه‌رو شد. دوباره تلاش کنید.'
		} finally {
			if (requestId === loadRequestId) loading = false
		}
	}

	function nextPage() {
		return loadPage()
	}

	onMount(nextPage)

	async function updateStatus(khatm: Khatm, nextStatus: ReviewStatus) {
		if (updatingIds.includes(khatm.id)) return
		updatingIds = [...updatingIds, khatm.id]
		try {
			await khatm.update({ reviewStatus: nextStatus })
			khatms = khatms.filter((item) => item.id !== khatm.id)
			toast('info', nextStatus === 'approved' ? 'ختم با موفقیت تأیید شد.' : 'ختم رد شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'ثبت نتیجه بررسی انجام نشد. دوباره تلاش کنید.')
		} finally {
			updatingIds = updatingIds.filter((id) => id !== khatm.id)
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
					{#each khatms as khatm (khatm.id)}
						<li class:ui-admin-review-item-loading={updatingIds.includes(khatm.id)}>
							<KhatmListCard
								{khatm}
								meta={khatm.reviewStatus === 'approved'
									? 'تأییدشده'
									: khatm.reviewStatus === 'rejected'
										? 'ردشده'
										: 'منتظر بررسی'}
								showDescription
							>
								{#snippet actions()}
									<a
										class="ui-btn ui-btn-sm ui-btn-icon ui-btn-ghost"
										href={getAdminDetailLink(khatm)}
										target="_blank"
										rel="noreferrer"
										aria-label={`مشاهده ختم ${khatm.title}`}
									><IconLink /></a>
									{#if khatm.reviewStatus === 'pending' || khatm.reviewStatus === 'approved'}
										<button
											class="ui-btn ui-btn-sm ui-btn-icon ui-admin-btn-reject"
											type="button"
											disabled={updatingIds.includes(khatm.id)}
											aria-label={`رد کردن ختم ${khatm.title}`}
											onclick={() => updateStatus(khatm, 'rejected')}
										>
											<IconRejected />
										</button>
									{/if}
									{#if khatm.reviewStatus === 'pending' || khatm.reviewStatus === 'rejected'}
										<button
											class="ui-btn ui-btn-sm ui-btn-icon ui-admin-btn-approve"
											type="button"
											disabled={updatingIds.includes(khatm.id)}
											aria-label={`تأیید ختم ${khatm.title}`}
											onclick={() => updateStatus(khatm, 'approved')}
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
