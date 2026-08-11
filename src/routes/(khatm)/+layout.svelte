<script lang="ts">
	import type { LayoutProps } from './$types'
	import Header from '$lib/components/Header.svelte'
	import IconViewWizard from '~icons/ic/twotone-view-carousel'
	import IconViewList from '~icons/ic/outline-view-agenda'
	import IconViewTable from '~icons/ic/round-calendar-view-month'
	import IconShare from '~icons/ic/outline-share'
	import IconCopy from '~icons/ic/outline-copy-all'
	import IconSettings from '~icons/ic/round-settings'
	import IconEdit from '~icons/ic/round-edit'
	import IconBook from '~icons/ic/round-menu-book'
	import IconPeople from '~icons/ic/round-people-alt'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { toast } from '$lib/components/TheToast.svelte'
	import { setKhatmContext } from './khatm-context.svelte'
	import { page } from '$app/state'
	import Tab from '$lib/components/Tab.svelte'
	import { browser } from '$app/environment'
	import { base } from '$app/paths'
	import { rebaseFullPath } from '$lib/utility/path'
	import ExpandableText from '$lib/components/ExpandableText.svelte'
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import { invalidateAll } from '$app/navigation'

	const { data, children }: LayoutProps = $props()

	const canShare = !browser || navigator.share

	const settingsEditor = SettingsEditor.use()
	settingsEditor.live = true

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

	setKhatmContext({
		get khatm() {
			return khatm
		},
		get parts() {
			return parts
		},
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

	const percentByAyah = $derived(khatm.percent)
	const percentByPage = $derived((khatm.getProgressByPage() || 0) * 100)
	const pageBasedProgress = $derived(settingsEditor.config.pageBasedProgress)
	function togglePageBasedProgress() {
		settingsEditor.config.pageBasedProgress = !pageBasedProgress
	}
	const percent = $derived(pageBasedProgress ? percentByPage : percentByAyah)

	const canSelectLayout = $derived(!khatm.finished && khatm.isFree)
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

<Header title="ختم قرآن گروهی" link={`${base}/`}>
	{#snippet end()}
		{#if data.canManage}
			<a
				href={`${base}/account/khatms/${khatm.id}/edit`}
				class="ui-btn ui-btn-icon ui-btn-ghost"
				aria-label="ویرایش ختم"
			>
				<IconEdit class="size-5" />
			</a>
		{/if}
		<a href={`${base}/settings`} class="ui-btn ui-btn-icon ui-btn-ghost" aria-label="تنظیمات">
			<IconSettings class="size-5" />
		</a>

		{#if canShare}
			<button type="button" class="ui-btn ui-btn-icon ui-btn-ghost" onclick={share} aria-label="اشتراک‌گذاری">
				<IconShare class="size-5" />
			</button>
		{:else}
			<button type="button" class="ui-btn ui-btn-icon ui-btn-ghost" onclick={copy} aria-label="کپی لینک">
				<IconCopy class="size-5" />
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
				{#if khatm.isSerial}<span class="ui-badge ui-badge-accent">{roundTitle}</span>{/if}
				{#if khatm.rangeType === 'ayah'}<span class="ui-badge ui-badge-info">آیه به آیه</span>{/if}
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
			<div class="ui-khatm-progress-value"><strong>{percent.toLocaleString('fa')}</strong><span>٪</span></div>
			<progress class="ui-progress ui-progress-success" max={100} value={percent} aria-label="پیشرفت ختم"></progress>
			<button type="button" class="ui-khatm-progress-toggle" onclick={togglePageBasedProgress}>
				نمایش بر اساس {pageBasedProgress ? 'صفحه' : 'آیه'}
			</button>
		</div>
	</section>

	{#if canSelectLayout}
		<section class="ui-khatm-view-switch" aria-label="شیوه نمایش بازه‌ها">
			<div class="ui-khatm-view-copy">
				<CurrentLayoutIcon />
				<div><strong>شیوه انتخاب</strong><span>نمای مناسب خودتان را انتخاب کنید</span></div>
			</div>
			<div class="ui-khatm-view-tabs">
				<Tab
					tabs={[
						{ slug: 'wizard', icon: IconViewWizard, title: 'مرحله‌ای', link: khatm.getLink('wizard') },
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
			<button class="ui-btn ui-btn-outline" onclick={invalidateAll}>شروع دور جدید</button>
		{/if}
	</div>
{:else}
	{@render children()}
{/if}
	</section>
</main>
