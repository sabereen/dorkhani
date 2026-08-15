<script lang="ts">
	import type { LayoutProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import IconViewWizard from '~icons/ic/twotone-view-carousel'
	import IconViewList from '~icons/ic/outline-view-agenda'
	import IconViewTable from '~icons/ic/round-calendar-view-month'
	import IconShare from '~icons/ic/outline-share'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconEdit from '~icons/ic/round-edit'
	import IconBook from '~icons/ic/round-menu-book'
	import IconPeople from '~icons/ic/round-people-alt'
	import IconLogin from '~icons/ic/round-login'
	import IconPersonAdd from '~icons/ic/round-person-add'
	import IconManageAccounts from '~icons/ic/round-manage-accounts'
	import IconClose from '~icons/ic/round-close'
	import IconStop from '~icons/ic/round-stop-circle'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import { setKhatmContext } from './khatm-context.svelte'
	import { page } from '$app/state'
	import Tab from '$lib/components/Tab.svelte'
	import { browser } from '$app/environment'
	import { base } from '$app/paths'
	import { rebaseFullPath } from '$lib/utility/path'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { invalidateAll } from '$app/navigation'
	import { idb_createdKhatm_hasClaim } from '$lib/idb/createdKhatm'
	import KhatmParticipation from './KhatmParticipation.svelte'
	import KhatmReviewBar from './KhatmReviewBar.svelte'
	import RangeTypeIcon from '$lib/components/RangeTypeIcon.svelte'

	const { data, children }: LayoutProps = $props()

	const canShare = !browser || navigator.share

	let layout = $derived.by<'wizard' | 'list' | 'grid'>(() => {
		if (page.url.pathname.includes('grid')) return 'grid'
		if (page.url.pathname.includes('list')) return 'list'
		return 'wizard'
	})
	const CurrentLayoutIcon = $derived(
		{
			wizard: IconViewWizard,
			list: IconViewList,
			grid: IconViewTable,
		}[layout],
	)

	const khatm = $derived(Khatm.fromPlain(data.khatm))

	const parts = $derived(khatm.getKhatmParts())
	const rawParts = $derived(khatm.getKhatmParts(false))

	setKhatmContext({
		get khatm() {
			return khatm
		},
		get parts() {
			return parts
		},
		get rawParts() {
			return rawParts
		},
	})

	$effect(() => {
		if (khatm.id > 0 || khatm.seriesId != null) {
			void khatm.participation.load()
		}
	})

	function share() {
		khatm.share()
	}

	async function copy() {
		try {
			await khatm.copy()
			toast('info', 'لینک ختم قرآن شما کپی شد.')
		} catch (err) {
			console.error(err)
			toast('error', 'خطا در کپی.')
		}
	}

	const roundTitle = $derived(khatm.getRoundTitle())

	const percent = $derived(khatm.percent)

	const canSelectLayout = $derived(!khatm.finished && khatm.isFree)
	const editHref = $derived(
		`${base}/account/khatms/${khatm.id}/edit${data.isAdmin ? '?admin=1' : ''}`,
	)
	let showAuthPrompt = $state(false)
	let showStopPrompt = $state(false)
	let canManageAsGuest = $state(false)
	const canRequestSeriesStop = $derived(data.canStopSeries && (data.isOwner || canManageAsGuest))
	const hasNextRound = $derived(
		khatm.isSerial && (data.seriesMaxRounds == null || khatm.roundNumber < data.seriesMaxRounds),
	)

	function requestSeriesStop() {
		if (data.isOwner) showStopPrompt = true
		else showAuthPrompt = true
	}

	$effect(() => {
		const khatmId = khatm.id
		const seriesId = khatm.seriesId
		let cancelled = false
		canManageAsGuest = false

		if (!data.isAuthenticated && !data.isAdmin) {
			idb_createdKhatm_hasClaim(khatmId, seriesId)
				.then((hasClaim) => {
					if (!cancelled) canManageAsGuest = hasClaim
				})
				.catch(() => {
					if (!cancelled) canManageAsGuest = false
				})
		}

		return () => {
			cancelled = true
		}
	})
</script>

<svelte:head>
	<title>ختم قرآن | {khatm.title}</title>
	<meta name="description" content={khatm.description} />
	<meta property="og:title" content="ختم قرآن | {khatm.title}" />
	<meta property="og:description" content={khatm.description} />
	<meta property="og:logo" content={rebaseFullPath('/hero.png')} />
	<meta property="og:image" content={rebaseFullPath('/hero.png')} />
	<meta property="og:url" content={khatm.link} />
	<meta property="og:type" content="website" />
	{#if khatm.private}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<Header title={khatm.title}>
	{#snippet end()}
		{#if data.canEdit}
			<a href={editHref} class="ui-header-page-action" aria-label="ویرایش ختم">
				<IconEdit class="size-5" />
				<span>ویرایش</span>
			</a>
		{:else if canManageAsGuest}
			<button
				type="button"
				class="ui-header-page-action"
				onclick={() => (showAuthPrompt = true)}
				aria-label="ویرایش یا حذف ختم"
			>
				<IconEdit class="size-5" />
				<span>مدیریت</span>
			</button>
		{/if}
		{#if canShare}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={share}
				aria-label="اشتراک‌گذاری"
			>
				<IconShare class="size-5" />
				<span>اشتراک‌گذاری</span>
			</button>
		{:else}
			<button
				type="button"
				class="ui-header-page-action ui-header-page-action-primary"
				onclick={copy}
				aria-label="کپی لینک"
			>
				<IconCopy class="size-5" />
				<span>کپی لینک</span>
			</button>
		{/if}
	{/snippet}
</Header>

<main class="ui-container-reading ui-khatm-page">
	<section class="ui-khatm-hero" aria-labelledby="khatm-title">
		<div class="ui-khatm-orb ui-khatm-orb-one" aria-hidden="true"></div>
		<div class="ui-khatm-orb ui-khatm-orb-two" aria-hidden="true"></div>
		<div class="ui-khatm-hero-copy">
			<div class="ui-khatm-eyebrow">
				<span class="ui-khatm-eyebrow-icon"><IconPeople /></span>
				<span>یک همراهی نورانی برای ختم قرآن</span>
			</div>
			<h1 id="khatm-title" class="ui-khatm-title">{khatm.title}</h1>
			<div class="ui-khatm-badges">
				{#if khatm.isSerial}
					<div class="ui-khatm-series-status">
						<span class="ui-badge ui-badge-accent">
							{roundTitle}
							{#if data.seriesMaxRounds != null}
								از {data.seriesMaxRounds.toLocaleString('fa')} دور
							{/if}
						</span>
						{#if canRequestSeriesStop}
							<button
								type="button"
								class="ui-btn ui-btn-xs ui-khatm-series-stop"
								onclick={requestSeriesStop}
								aria-label="توقف ختم پس از پایان دور جاری"
							>
								<IconStop />
								<span>توقف پس از این دور</span>
							</button>
						{/if}
					</div>
				{/if}
				<span class="ui-badge ui-badge-info ui-range-type-badge">
					<RangeTypeIcon type={khatm.rangeType} />
					{khatm.rangeTypeTitle}
				</span>
				{#if khatm.private}<span class="ui-badge ui-badge-neutral">خصوصی</span>{/if}
			</div>
			{#if khatm.description}
				<div dir="auto" class="ui-khatm-description">
					<ExpandableText text={khatm.description} maxLength={250} threshold={10} />
				</div>
			{/if}
		</div>

		<div class="ui-khatm-progress-card">
			<div class="ui-khatm-progress-heading">
				<span class="ui-khatm-progress-icon"><IconBook /></span>
				<div>
					<strong>پیشرفت ختم</strong>
					<span>قدم‌به‌قدم تا پایان این همراهی</span>
				</div>
			</div>
			<div class="ui-khatm-progress-value">
				<strong>{percent.toLocaleString('fa')}</strong><span>٪</span>
			</div>
			<progress
				class="ui-progress ui-progress-success"
				max={100}
				value={percent}
				aria-label="پیشرفت ختم"
			></progress>
		</div>
	</section>

	{#if khatm.reviewStatus !== 'approved'}
		<section class="ui-alert ui-alert-info" role="alert" aria-label="وضعیت تأیید ختم">
			<div>
				<strong>این ختم هنوز توسط سامانه تأیید نشده است.</strong>
				<p>ما محتوای این ختم را تأیید نمی‌کنیم و استفاده و مشارکت در آن با مسئولیت کاربران است.</p>
			</div>
		</section>
	{/if}
	{#if khatm.aiReviewStatus === 'warning' && khatm.aiReviewReason}
		<section class="ui-alert ui-alert-error" role="alert" aria-label="هشدار بررسی AI">
			<div>
				<strong>هشدار دربارهٔ عنوان یا توضیح ختم</strong>
				<p>{khatm.aiReviewReason}</p>
			</div>
		</section>
	{/if}

	{#if data.isAdmin && !khatm.private}
		<KhatmReviewBar {khatm} featuredOrder={data.featuredOrder} canFeature={data.canFeature} />
	{/if}

	<KhatmParticipation {khatm} />

	{#if canSelectLayout}
		<section class="ui-khatm-view-switch" aria-label="شیوه نمایش بازه‌ها">
			<div class="ui-khatm-view-copy">
				<CurrentLayoutIcon />
				<div><strong>شیوه انتخاب</strong><span>نمای مناسب خودتان را انتخاب کنید</span></div>
			</div>
			<div class="ui-khatm-view-tabs">
				<Tab
					noScroll
					tabs={[
						{
							slug: 'wizard',
							icon: IconViewWizard,
							title: 'مرحله‌ای',
							link: khatm.getLink('wizard'),
						},
						{ slug: 'list', icon: IconViewList, title: 'لیستی', link: khatm.getLink('list') },
						{ slug: 'grid', icon: IconViewTable, title: 'جدولی', link: khatm.getLink('grid') },
					]}
					bind:value={() => layout, () => {}}
				/>
			</div>
		</section>
	{/if}

	<section class="ui-khatm-content">
		{#if khatm.finished}
			<div class="ui-alert ui-alert-success ui-khatm-complete">
				<p>
					{#if khatm.isSerial}
						این دور از ختم کامل شده است ({roundTitle})
					{:else}
						این ختم قرآن کامل شده است.
					{/if}
				</p>
				{#if khatm.isSerial}
					{#if hasNextRound}
						<button class="ui-btn ui-btn-outline" onclick={invalidateAll}>شروع دور جدید</button>
					{:else}
						<span class="ui-badge ui-badge-success">آخرین دور ختم</span>
					{/if}
				{/if}
			</div>
		{:else}
			{@render children()}
		{/if}
	</section>
</main>

<Modal bind:open={showStopPrompt} contentClass="ui-khatm-stop-dialog">
	<div class="ui-khatm-stop-icon" aria-hidden="true"><IconStop /></div>
	<p class="ui-khatm-stop-eyebrow">پایان ختم تمام‌نشدنی</p>
	<h2>این دور، آخرین دور باشد؟</h2>
	<p class="ui-khatm-stop-description">
		دور جاری بدون تغییر ادامه پیدا می‌کند، اما پس از کامل‌شدن آن دور تازه‌ای ساخته نخواهد شد.
	</p>
	<div class="ui-khatm-stop-actions">
		<form
			method="POST"
			action={`${base}/account/khatms/${khatm.id}/stop?returnTo=${encodeURIComponent(page.url.pathname + page.url.search)}`}
		>
			<button class="ui-btn ui-btn-danger ui-btn-block" type="submit">
				<IconStop class="size-5" />
				بله، ختم متوقف شود
			</button>
		</form>
		<button
			class="ui-btn ui-btn-ghost ui-btn-block"
			type="button"
			onclick={() => (showStopPrompt = false)}
		>
			ادامهٔ دورهای ختم
		</button>
	</div>
</Modal>

<Modal bind:open={showAuthPrompt} contentClass="ui-khatm-auth-dialog">
	<button
		type="button"
		class="ui-btn ui-btn-icon ui-btn-ghost ui-khatm-auth-close"
		onclick={() => (showAuthPrompt = false)}
		aria-label="بستن پنجره"
	>
		<IconClose class="size-5" />
	</button>
	<div class="ui-khatm-auth-icon" aria-hidden="true">
		<IconManageAccounts />
	</div>
	<p class="ui-khatm-auth-eyebrow">مدیریت ختم</p>
	<h2>برای مدیریت ختم خود وارد حساب شوید</h2>
	<p class="ui-khatm-auth-description">
		پس از ورود یا ثبت‌نام، این ختم به حساب شما متصل می‌شود و می‌توانید آن را ویرایش، متوقف یا حذف
		کنید.
	</p>
	<div class="ui-khatm-auth-actions">
		<a class="ui-btn ui-btn-primary ui-btn-lg" href={`${base}/auth/login`}>
			<IconLogin class="size-5" />
			ورود به حساب
		</a>
		<a class="ui-btn ui-btn-soft ui-btn-lg" href={`${base}/auth/register`}>
			<IconPersonAdd class="size-5" />
			ثبت‌نام
		</a>
	</div>
</Modal>
