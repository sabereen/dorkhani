<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
	import type { PageProps } from './$types'
	import HistoryKhatm from './history/history-khatm.svelte'
	import HistoryPickedRange from './history/history-picked-range.svelte'
	import HistoryZekr from './history/history-zekr.svelte'

	import IconAdd from '~icons/ic/round-add'
	import IconArrow from '~icons/ic/round-arrow-back'
	import IconAutoAwesome from '~icons/ic/round-auto-awesome'
	import IconCalendar from '~icons/ic/round-calendar-today'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconGroups from '~icons/ic/round-groups'
	import IconHistory from '~icons/ic/round-history'
	import IconMenuBook from '~icons/ic/round-menu-book'
	import IconMore from '~icons/ic/outline-read-more'
	import IconShare from '~icons/ic/round-share'
	import IconStats from '~icons/ic/round-query-stats'
	import IconStar from '~icons/ic/round-star'

	const { data }: PageProps = $props()

	const khatms = $derived(Khatm.fromPlainList(data.khatms))
	const featuredKhatms = $derived(Khatm.fromPlainList(data.featuredKhatms))
	const showcase = $derived(Khatm.fromPlainList(data.showcase))
	const zekrList = $derived(Zekr.fromPlainList(data.zekrList))
	const statistics = $derived(data.statistics)
	const branding = $derived(
		data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, base),
	)
	const maximumDailyAyahs = $derived(
		Math.max(1, ...statistics.daily.map((item) => item.recitedAyahs)),
	)
	const weeklyRecitedAyahs = $derived(
		statistics.daily.reduce((total, item) => total + item.recitedAyahs, 0),
	)
	const dailyWeekdayFormatter = new Intl.DateTimeFormat('fa-IR', {
		weekday: 'short',
		timeZone: 'UTC',
	})
	const dailyDateFormatter = new Intl.DateTimeFormat('fa-IR', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	})

	function formatDailyWeekday(date: string) {
		return dailyWeekdayFormatter.format(new Date(`${date}T00:00:00.000Z`))
	}

	function formatDailyShortDate(date: string) {
		return dailyDateFormatter.format(new Date(`${date}T00:00:00.000Z`))
	}

	function dailyBarHeight(recitedAyahs: number) {
		return Math.max(3, Math.round((recitedAyahs / maximumDailyAyahs) * 100))
	}
</script>

<svelte:head>
	<title>{branding.seoTitle}</title>
	<meta
		name="description"
		content={branding.seoDescription}
	/>
	<meta property="og:title" content={branding.seoTitle} />
	<meta property="og:description" content={branding.seoDescription} />
	<meta property="og:logo" content={new URL(branding.icon512Url, page.url.origin).href} />
	<meta property="og:image" content={new URL(branding.icon512Url, page.url.origin).href} />
</svelte:head>

<Header />

<div class="landing-page">
	<section class="landing-hero" aria-labelledby="landing-title">
		<div class="landing-orb landing-orb-one" aria-hidden="true"></div>
		<div class="landing-orb landing-orb-two" aria-hidden="true"></div>

		<div class="landing-hero-copy">
			<span class="landing-eyebrow">
				<IconAutoAwesome class="size-5" />
				یک قرار جمعی برای انس با قرآن
			</span>
			<h1 id="landing-title">{branding.heroTitle}<br /><span>{branding.heroHighlight}</span></h1>
			<p>{branding.heroDescription}</p>
			<div class="landing-hero-actions">
				<a class="ui-btn ui-btn-xl landing-primary-action" href={`${base}/add`}>
					<IconAdd class="size-6" />
					ایجاد ختم جدید
				</a>
				<a class="ui-btn ui-btn-xl landing-secondary-action" href={`${base}/list`}>
					دیدن ختم‌های عمومی
					<IconArrow class="size-5" />
				</a>
			</div>
			<div class="landing-hero-points" aria-label="ویژگی‌های سامانه">
				<span><IconCheck /> تقسیم منظم بازه‌ها</span>
				<span><IconCheck /> گزارش پیشرفت جمع</span>
				<span><IconCheck /> دسترسی ساده با لینک</span>
			</div>
		</div>

		<div class="landing-visual">
			<div class="landing-image-frame">
				<img src={branding.heroImageUrl} width="480" alt={branding.heroImageAlt} />
			</div>
			<div class="landing-floating-card landing-floating-top">
				<span class="landing-floating-icon"><IconGroups /></span>
				<span><strong>با هم شروع کنید</strong><small>هر نفر، یک سهم روشن</small></span>
			</div>
			<div class="landing-floating-card landing-floating-bottom">
				<span class="landing-progress-mark"><IconCheck /></span>
				<span><strong>مسیر همیشه پیداست</strong><small>پیشرفت ختم را یک‌جا ببینید</small></span>
			</div>
		</div>
	</section>

	<section class="landing-features" aria-label="چرا ختم جمعی؟">
		<article class="landing-feature-card">
			<span class="landing-feature-icon landing-feature-icon-purple"><IconMenuBook /></span>
			<div>
				<h2>سهم هرکس مشخص</h2>
				<p>بازه‌های خوانده‌نشده شفاف‌اند و هر همراه می‌تواند سهم مناسب خود را انتخاب کند.</p>
			</div>
		</article>
		<article class="landing-feature-card">
			<span class="landing-feature-icon landing-feature-icon-green"><IconStats /></span>
			<div>
				<h2>پیشرفت قابل پیگیری</h2>
				<p>وضعیت ختم، مشارکت‌ها و بخش‌های باقی‌مانده همیشه پیش چشم همه‌ی اعضاست.</p>
			</div>
		</article>
		<article class="landing-feature-card">
			<span class="landing-feature-icon landing-feature-icon-gold"><IconShare /></span>
			<div>
				<h2>دعوت با یک لینک</h2>
				<p>لینک ختم را برای خانواده و دوستان بفرستید و جمع‌تان را به‌سادگی شکل دهید.</p>
			</div>
		</article>
	</section>

	<section class="landing-section landing-statistics" aria-labelledby="statistics-title">
		<div class="landing-section-heading">
			<div>
				<span class="landing-section-kicker"><IconStats /> روایت همراهی‌ها</span>
				<h2 id="statistics-title">هر تلاوت، بخشی از یک جریان زنده</h2>
				<p>نگاهی به ثمرهٔ همراهی همهٔ کسانی که در این سامانه قرآن خوانده‌اند.</p>
			</div>
		</div>

		<div class="landing-stat-total-grid">
			<article class="ui-card ui-card-bordered landing-stat-total-card">
				<div class="ui-card-body">
					<span class="landing-stat-total-icon landing-stat-total-icon-primary" aria-hidden="true">
						<IconMenuBook />
					</span>
					<div>
						<p class="landing-stat-total-label">آیات تلاوت‌شده در سامانه</p>
						<strong class="landing-stat-total-value">
							{statistics.totals.recitedAyahs.toLocaleString('fa')}
						</strong>
						<p class="landing-stat-total-description">آیه که با همراهی جمع خوانده شده است</p>
					</div>
				</div>
			</article>
			<article class="ui-card ui-card-bordered landing-stat-total-card">
				<div class="ui-card-body">
					<span class="landing-stat-total-icon landing-stat-total-icon-success" aria-hidden="true">
						<IconCheck />
					</span>
					<div>
						<p class="landing-stat-total-label">دورهای کامل‌شده در سامانه</p>
						<strong class="landing-stat-total-value">
							{statistics.totals.completedRounds.toLocaleString('fa')}
						</strong>
						<p class="landing-stat-total-description">دور ختم قرآن که به پایان رسیده است</p>
					</div>
				</div>
			</article>
		</div>

		<div class="landing-daily-panel">
			<div class="landing-daily-heading">
				<div class="landing-daily-title">
					<span class="landing-daily-heading-icon" aria-hidden="true"><IconCalendar /></span>
					<div>
						<h3>نبض تلاوت در هفت روز اخیر</h3>
						<p>روند روزانهٔ فعالیت سامانه بر اساس زمان تهران</p>
					</div>
				</div>
				<div class="landing-daily-summary">
					<strong>{weeklyRecitedAyahs.toLocaleString('fa')}</strong>
					<span>آیه در این هفته</span>
				</div>
			</div>

			<div class="landing-daily-legend" aria-label="راهنمای نمودار">
				<span class="landing-daily-legend-ayah">آیات تلاوت‌شده</span>
				<span class="landing-daily-legend-created">ختم ایجادشده</span>
				<span class="landing-daily-legend-completed">دور کامل‌شده</span>
			</div>

			<div class="landing-daily-chart-frame">
				<div class="landing-daily-grid-lines" aria-hidden="true">
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
				<ul class="landing-daily-list" aria-label="آمار فعالیت هفت روز اخیر">
					{#each statistics.daily as item}
						<li>
							<div class="landing-daily-bar-column">
								<strong>{item.recitedAyahs.toLocaleString('fa')}</strong>
								<span
									class="landing-daily-bar"
									style={`height: ${dailyBarHeight(item.recitedAyahs)}%`}
									aria-hidden="true"
								></span>
							</div>
							<time datetime={item.date}>
								<strong>{formatDailyWeekday(item.date)}</strong>
								<span>{formatDailyShortDate(item.date)}</span>
							</time>
							<dl class="landing-daily-details">
								<div>
									<dt class="ui-sr-only">ختم ایجادشده</dt>
									<dd>{item.createdKhatms.toLocaleString('fa')}</dd>
								</div>
								<div>
									<dt class="ui-sr-only">دور کامل‌شده</dt>
									<dd>{item.completedRounds.toLocaleString('fa')}</dd>
								</div>
							</dl>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section class="landing-section landing-personal" aria-labelledby="personal-title">
		<div class="landing-section-heading">
			<div>
				<span class="landing-section-kicker"><IconHistory /> مسیر شما</span>
				<h2 id="personal-title">از همان‌جایی که بودید ادامه دهید</h2>
				<p>آخرین ختم‌ها و مشارکت‌های شما روی همین دستگاه نگهداری می‌شوند.</p>
			</div>
			<a class="ui-btn ui-btn-ghost" href={`${base}/history`}>
				تاریخچه کامل
				<IconArrow class="size-5" />
			</a>
		</div>

		<div class="landing-history-grid">
			<HistoryKhatm limit={3} title="ختم‌هایی که ساخته‌اید">
				{#snippet fallback()}
					<article class="landing-empty-card">
						<span class="landing-empty-icon"><IconAdd /></span>
						<h3>هنوز ختمی نساخته‌اید</h3>
						<p>اولین جمع قرآنی‌تان را همین امروز شکل دهید.</p>
						<a class="ui-btn ui-btn-soft ui-btn-sm" href={`${base}/add`}>ایجاد اولین ختم</a>
					</article>
				{/snippet}
			</HistoryKhatm>
			<HistoryZekr limit={3} title="ختم‌های ذکر شما" />
			<HistoryPickedRange limit={3} title="آخرین مشارکت‌ها">
				{#snippet fallback()}
					<article class="landing-empty-card">
						<span class="landing-empty-icon"><IconMenuBook /></span>
						<h3>هنوز سهمی انتخاب نکرده‌اید</h3>
						<p>به یک ختم عمومی بپیوندید و سهم خودتان را بردارید.</p>
						<a class="ui-btn ui-btn-soft ui-btn-sm" href={`${base}/list`}>مشاهده ختم‌ها</a>
					</article>
				{/snippet}
			</HistoryPickedRange>
		</div>
	</section>

	{#snippet khatmList(
		items: Khatm[],
		title: string,
		description: string,
		moreLink?: string,
		featured = false,
	)}
		<section class:landing-public-card-featured={featured} class="landing-public-card">
			<div class="landing-public-header">
				<div>
					<span class="landing-public-icon">
						{#if featured}<IconAutoAwesome />{:else}<IconGroups />{/if}
					</span>
					<h3>{title}</h3>
					<p>{description}</p>
				</div>
				{#if moreLink}
					<a href={moreLink} class="ui-btn ui-btn-ghost ui-btn-sm">
						همه موارد
						<IconMore class="size-5 -scale-x-100" />
					</a>
				{/if}
			</div>
			<ul class="ui-khatm-card-list landing-khatm-card-list">
				{#each items.slice(0, 6) as khatm}
					<li>
						<KhatmListCard {khatm} meta="برای مشارکت وارد شوید" />
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{#if featuredKhatms.length > 0 || showcase.length > 0 || khatms.length > 0 || zekrList.length > 0}
		<section class="landing-section" aria-labelledby="public-title">
			<div class="landing-section-heading">
				<div>
					<span class="landing-section-kicker"><IconGroups /> جمع‌های روشن</span>
					<h2 id="public-title">همین حالا به یک ختم بپیوندید</h2>
					<p>از میان ختم‌های عمومی، جمعی را انتخاب کنید و سهمی از این مسیر داشته باشید.</p>
				</div>
			</div>

			{#if featuredKhatms.length > 0}
				<section class="landing-featured-showcase" aria-labelledby="featured-khatms-title">
					<div class="landing-featured-heading">
						<span class="landing-featured-icon" aria-hidden="true"><IconStar /></span>
						<div>
							<span class="landing-featured-kicker">نیت‌های ماندگار، همراهی همیشگی</span>
							<h3 id="featured-khatms-title">ختم‌های شاخص</h3>
							<p>ختم‌های دائمی برای موضوعات ویژه؛ هر دور که تمام شود، دور تازه‌ای آغاز می‌شود.</p>
						</div>
					</div>
					<ul class="landing-featured-grid">
						{#each featuredKhatms as khatm (khatm.id)}
							<li>
								<KhatmListCard {khatm} meta="ختم دائمی شاخص" showDescription />
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<div class="landing-public-grid">
				{#if showcase.length > 0}
					{@render khatmList(
						showcase,
						'پرمشارکت‌های این روزها',
						'این فهرست به‌صورت خودکار بر اساس بیشترین تعداد آیات خوانده‌شده در ۳ روز گذشته مرتب می‌شود.',
						undefined,
						true,
					)}
				{/if}
				{#if khatms.length > 0}
					{@render khatmList(
						khatms,
						'تازه‌ترین ختم‌ها',
						'جمع‌های عمومی و تأییدشده',
						`${base}/list`,
					)}
				{/if}

				{#if zekrList.length > 0}
					<section class="landing-public-card">
						<div class="landing-public-header">
							<div>
								<span class="landing-public-icon"><IconAutoAwesome /></span>
								<h3>حلقه‌های ذکر</h3>
								<p>همراهی‌های کوچک و پیوسته برای یاد خدا</p>
							</div>
						</div>
						<ul class="landing-public-list">
							{#each zekrList.slice(0, 6) as zekr}
								<li>
									<a href={zekr.link}>
										<span class="landing-list-main">
											<strong>{zekr.title}</strong>
											<span>
												{#if zekr.isFinite}
													<span class="ui-badge ui-badge-info ui-badge-xs"
														>{zekr.targetCount.toLocaleString('fa')} تایی</span
													>
												{/if}
												<span class="landing-list-hint">تعداد ثبت‌شده</span>
											</span>
										</span>
										<span class="landing-list-progress">
											<strong>{zekr.count.toLocaleString('fa')}</strong>
											{#if zekr.isFinite}
												<progress
													class="ui-progress ui-progress-success"
													max={100}
													value={zekr.percent}
												></progress>
											{/if}
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>
		</section>
	{/if}

	<section class="landing-section landing-how" aria-labelledby="how-title">
		<div class="landing-section-heading landing-section-heading-centered">
			<div>
				<span class="landing-section-kicker"><IconMenuBook /> خیلی ساده</span>
				<h2 id="how-title">سه قدم تا یک ختم جمعی</h2>
				<p>از ساختن جمع تا پایان قرائت، همه‌چیز روشن و بی‌دردسر پیش می‌رود.</p>
			</div>
		</div>
		<ol class="landing-steps">
			<li>
				<span class="landing-step-number">۱</span>
				<h3>ختم را بسازید</h3>
				<p>یک عنوان انتخاب کنید و شیوه‌ی تقسیم آیات، صفحات یا اجزا را مشخص کنید.</p>
			</li>
			<li>
				<span class="landing-step-number">۲</span>
				<h3>همراهان را دعوت کنید</h3>
				<p>لینک اختصاصی ختم را در جمع خانواده، دوستان یا همکاران به اشتراک بگذارید.</p>
			</li>
			<li>
				<span class="landing-step-number">۳</span>
				<h3>با هم به پایان برسانید</h3>
				<p>هرکس سهم خود را می‌خواند و پیشرفت جمع برای همه به‌روز می‌ماند.</p>
			</li>
		</ol>
	</section>

	<section class="landing-cta" aria-labelledby="cta-title">
		<div>
			<span class="landing-section-kicker landing-section-kicker-light"
				><IconAutoAwesome /> یک قدم روشن</span
			>
			<h2 id="cta-title">جمع قرآنی شما می‌تواند همین امروز شکل بگیرد</h2>
			<p>نیت کنید، ختم را بسازید و اولین دعوت را برای یک همراه بفرستید.</p>
		</div>
		<a class="ui-btn ui-btn-xl landing-primary-action" href={`${base}/add`}>
			<IconAdd class="size-6" />
			شروع ختم جدید
		</a>
	</section>
</div>

<style>
	.landing-page {
		padding-top: 1rem;
	}

	.landing-hero {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1.08fr) minmax(18rem, 0.92fr);
		grid-gap: 2.5rem;
		min-height: 34rem;
		align-items: center;
		padding: 3.5rem;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: var(--ui-radius-xl);
		background: linear-gradient(
			135deg,
			var(--ui-color-landing-hero),
			var(--ui-color-landing-hero-end)
		);
		color: var(--ui-color-landing-hero-text);
		box-shadow: var(--ui-shadow-lg);
		overflow: hidden;
	}

	.landing-orb {
		position: absolute;
		border-radius: 9999px;
		background: var(--ui-color-landing-glow);
		filter: blur(2px);
		opacity: 0.34;
	}

	.landing-orb-one {
		top: -7rem;
		right: -6rem;
		width: 20rem;
		height: 20rem;
	}

	.landing-orb-two {
		bottom: -9rem;
		left: 18%;
		width: 22rem;
		height: 22rem;
		opacity: 0.14;
	}

	.landing-hero-copy,
	.landing-visual {
		position: relative;
		z-index: 1;
	}

	.landing-eyebrow,
	.landing-section-kicker {
		display: inline-flex;
		align-items: center;
		font-size: 0.8rem;
		font-weight: 800;
	}

	.landing-eyebrow {
		padding: 0.55rem 0.85rem;
		border: 1px solid rgba(255, 255, 255, 0.22);
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.1);
		color: var(--ui-color-landing-hero-muted);
	}

	.landing-eyebrow > :global(*) + :global(*),
	.landing-section-kicker > :global(*) + :global(*) {
		margin-right: 0.4rem;
	}

	.landing-hero h1 {
		max-width: 38rem;
		margin: 1rem 0 0;
		font-size: 3.65rem;
		font-weight: 950;
		line-height: 1.25;
		letter-spacing: -0.04em;
	}

	.landing-hero h1 span {
		color: var(--ui-color-landing-accent);
	}

	.landing-hero-copy > p {
		max-width: 38rem;
		margin: 0.9rem 0 0;
		color: var(--ui-color-landing-hero-muted);
		font-size: 1.1rem;
		line-height: 2;
	}

	.landing-hero-actions {
		display: flex;
		flex-wrap: wrap;
		margin-top: 1.35rem;
	}

	.landing-hero-actions > * + * {
		margin-right: 0.75rem;
	}

	.landing-primary-action {
		border-color: var(--ui-color-landing-accent);
		background: var(--ui-color-landing-accent);
		color: var(--ui-color-landing-accent-text);
		box-shadow: var(--ui-shadow-md);
	}

	.landing-primary-action:hover {
		border-color: var(--ui-color-landing-accent-hover);
		background: var(--ui-color-landing-accent-hover);
		color: var(--ui-color-landing-accent-text);
	}

	.landing-secondary-action {
		border-color: rgba(255, 255, 255, 0.35);
		background: rgba(255, 255, 255, 0.08);
		color: var(--ui-color-landing-hero-text);
	}

	.landing-secondary-action:hover {
		border-color: rgba(255, 255, 255, 0.7);
		background: rgba(255, 255, 255, 0.16);
		color: var(--ui-color-landing-hero-text);
	}

	.landing-hero-points {
		display: flex;
		flex-wrap: wrap;
		margin-top: 1rem;
		color: var(--ui-color-landing-hero-muted);
		font-size: 0.75rem;
	}

	.landing-hero-points span {
		display: inline-flex;
		align-items: center;
		margin-top: 0.5rem;
		margin-left: 1rem;
	}

	.landing-hero-points :global(svg) {
		width: 1rem;
		height: 1rem;
		margin-left: 0.3rem;
		color: var(--ui-color-landing-accent);
	}

	.landing-visual {
		max-width: 28rem;
		margin-right: auto;
		margin-left: auto;
	}

	.landing-image-frame {
		padding: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.24);
		border-radius: var(--ui-radius-xl);
		background: rgba(255, 255, 255, 0.1);
		box-shadow: var(--ui-shadow-lg);
	}

	.landing-image-frame img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 28rem;
		margin-right: auto;
		margin-left: auto;
		border-radius: var(--ui-radius-lg);
		object-fit: contain;
	}

	.landing-floating-card {
		position: absolute;
		display: flex;
		min-width: 13.5rem;
		align-items: center;
		padding: 0.8rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-surface-raised);
		color: var(--ui-color-text);
		box-shadow: var(--ui-shadow-lg);
	}

	.landing-floating-card > * + * {
		margin-right: 0.7rem;
	}

	.landing-floating-card strong,
	.landing-floating-card small {
		display: block;
	}

	.landing-floating-card strong {
		font-size: 0.8rem;
	}

	.landing-floating-card small {
		margin-top: 0.15rem;
		color: var(--ui-color-text-muted);
		font-size: 0.65rem;
	}

	.landing-floating-top {
		top: 2.5rem;
		right: -3rem;
	}

	.landing-floating-bottom {
		bottom: 2rem;
		left: -2.75rem;
	}

	.landing-floating-icon,
	.landing-progress-mark {
		display: flex;
		width: 2.3rem;
		height: 2.3rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.landing-progress-mark {
		border-radius: 9999px;
		background: var(--ui-color-success-soft);
		color: var(--ui-color-success);
	}

	.landing-features {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 1rem;
		margin: -2rem 2rem 0;
	}

	.landing-feature-card {
		display: flex;
		align-items: flex-start;
		padding: 1.15rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.25rem;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-feature-card > * + * {
		margin-right: 0.85rem;
	}

	.landing-feature-icon {
		display: flex;
		width: 3rem;
		height: 3rem;
		flex: 0 0 3rem;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
	}

	.landing-feature-icon :global(svg) {
		width: 1.5rem;
		height: 1.5rem;
	}

	.landing-feature-icon-purple {
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.landing-feature-icon-green {
		background: var(--ui-color-success-soft);
		color: var(--ui-color-success);
	}

	.landing-feature-icon-gold {
		background: var(--ui-color-accent-soft);
		color: var(--ui-color-accent);
	}

	.landing-feature-card h2,
	.landing-feature-card p {
		margin: 0;
	}

	.landing-feature-card h2 {
		font-size: 1rem;
		font-weight: 900;
	}

	.landing-feature-card p {
		margin-top: 0.35rem;
		color: var(--ui-color-text-muted);
		font-size: 0.78rem;
		line-height: 1.75;
	}

	.landing-statistics {
		position: relative;
	}

	.landing-stat-total-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-gap: 1rem;
	}

	.landing-stat-total-card {
		border-radius: 1.5rem;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-stat-total-card .ui-card-body {
		align-items: center;
		flex-direction: row;
		padding: 1.75rem;
	}

	.landing-stat-total-card .ui-card-body > * + * {
		margin-top: 0;
		margin-right: 1rem;
	}

	.landing-stat-total-icon {
		display: flex;
		width: 4rem;
		height: 4rem;
		flex: 0 0 4rem;
		align-items: center;
		justify-content: center;
		border-radius: 1.25rem;
	}

	.landing-stat-total-icon :global(svg) {
		width: 2rem;
		height: 2rem;
	}

	.landing-stat-total-icon-primary {
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.landing-stat-total-icon-success {
		background: var(--ui-color-success-soft);
		color: var(--ui-color-success);
	}

	.landing-stat-total-label,
	.landing-stat-total-description {
		margin: 0;
	}

	.landing-stat-total-label {
		color: var(--ui-color-text-muted);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.landing-stat-total-value {
		display: block;
		margin-top: 0.35rem;
		color: var(--ui-color-text);
		font-size: 2.35rem;
		font-weight: 950;
		line-height: 1.2;
	}

	.landing-stat-total-description {
		margin-top: 0.35rem;
		color: var(--ui-color-text-muted);
		font-size: 0.72rem;
	}

	.landing-daily-panel {
		margin-top: 1rem;
		padding: 1.75rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.5rem;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-daily-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.landing-daily-title {
		display: flex;
		align-items: center;
	}

	.landing-daily-title > * + * {
		margin-right: 0.75rem;
	}

	.landing-daily-heading-icon {
		display: flex;
		width: 2.75rem;
		height: 2.75rem;
		flex: 0 0 2.75rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.9rem;
		background: var(--ui-color-warning-soft);
		color: var(--ui-color-warning);
	}

	.landing-daily-heading h3,
	.landing-daily-heading p {
		margin: 0;
	}

	.landing-daily-heading h3 {
		font-size: 1rem;
		font-weight: 900;
	}

	.landing-daily-heading p {
		margin-top: 0.2rem;
		color: var(--ui-color-text-muted);
		font-size: 0.75rem;
	}

	.landing-daily-summary {
		padding: 0.65rem 1rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
		text-align: center;
	}

	.landing-daily-summary strong,
	.landing-daily-summary span {
		display: block;
	}

	.landing-daily-summary strong {
		font-size: 1.2rem;
		font-weight: 950;
		line-height: 1.2;
	}

	.landing-daily-summary span {
		margin-top: 0.15rem;
		font-size: 0.65rem;
		font-weight: 800;
	}

	.landing-daily-legend {
		display: flex;
		align-items: center;
		margin-top: 1.25rem;
		color: var(--ui-color-text-muted);
		font-size: 0.68rem;
		font-weight: 800;
	}

	.landing-daily-legend > * + * {
		margin-right: 1.1rem;
	}

	.landing-daily-legend span {
		display: inline-flex;
		align-items: center;
	}

	.landing-daily-legend span::before {
		display: inline-block;
		width: 0.55rem;
		height: 0.55rem;
		margin-left: 0.4rem;
		border-radius: 9999px;
		background: var(--ui-color-primary);
		content: '';
	}

	.landing-daily-legend .landing-daily-legend-ayah::before {
		width: 1.25rem;
		border-radius: 9999px 9999px 0.3rem 0.3rem;
		background: linear-gradient(90deg, var(--ui-color-primary), var(--ui-color-success));
	}

	.landing-daily-legend .landing-daily-legend-created::before {
		background: var(--ui-color-success);
	}

	.landing-daily-legend .landing-daily-legend-completed::before {
		background: var(--ui-color-warning);
	}

	.landing-daily-chart-frame {
		position: relative;
		margin-top: 0.85rem;
		padding: 1.35rem 1rem 0.85rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.25rem;
		background: var(--ui-color-surface-muted);
		overflow: hidden;
	}

	.landing-daily-grid-lines {
		position: absolute;
		top: 1.35rem;
		right: 1rem;
		left: 1rem;
		display: flex;
		height: 12rem;
		flex-direction: column;
		justify-content: space-between;
	}

	.landing-daily-grid-lines span {
		display: block;
		border-top: 1px dashed var(--ui-color-border);
	}

	.landing-daily-list {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		grid-gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.landing-daily-list > li {
		display: grid;
		min-width: 0;
		grid-template-rows: 12rem 3.2rem 1.8rem;
		text-align: center;
	}

	.landing-daily-bar-column {
		display: flex;
		min-width: 0;
		align-items: flex-end;
		justify-content: flex-end;
		flex-direction: column;
		padding: 0 0.35rem;
	}

	.landing-daily-bar-column strong {
		align-self: center;
		margin-bottom: 0.4rem;
		padding: 0.12rem 0.35rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 9999px;
		background: var(--ui-color-surface-raised);
		font-size: 0.72rem;
		font-weight: 950;
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-daily-bar {
		display: block;
		width: 56%;
		min-width: 0.8rem;
		max-width: 3.25rem;
		align-self: center;
		border-radius: 0.8rem 0.8rem 0.25rem 0.25rem;
		background: linear-gradient(180deg, var(--ui-color-primary), var(--ui-color-success));
		box-shadow: 0 8px 18px var(--ui-color-focus);
	}

	.landing-daily-list time strong,
	.landing-daily-list time span {
		display: block;
	}

	.landing-daily-list time {
		padding-top: 0.6rem;
		border-top: 2px solid var(--ui-color-border-strong);
		color: var(--ui-color-text);
	}

	.landing-daily-list time strong {
		font-size: 0.72rem;
		font-weight: 900;
	}

	.landing-daily-list time span {
		margin-top: 0.2rem;
		color: var(--ui-color-text-muted);
		font-size: 0.62rem;
	}

	.landing-daily-details {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
	}

	.landing-daily-details div {
		min-width: 0;
	}

	.landing-daily-details div + div {
		margin-right: 0.35rem;
	}

	.landing-daily-details dt,
	.landing-daily-details dd {
		margin: 0;
	}

	.landing-daily-details dd {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.35rem;
		border-radius: 9999px;
		background: var(--ui-color-surface-raised);
		font-size: 0.68rem;
		font-weight: 900;
	}

	.landing-daily-details dd::before {
		display: inline-block;
		width: 0.38rem;
		height: 0.38rem;
		margin-left: 0.25rem;
		border-radius: 9999px;
		background: var(--ui-color-success);
		content: '';
	}

	.landing-daily-details div + div dd::before {
		background: var(--ui-color-warning);
	}

	.landing-section {
		padding-top: 4rem;
	}

	.landing-personal {
		margin-top: 3.5rem;
		padding: 2rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 2rem;
		background: var(--ui-color-surface);
	}

	.landing-section-heading {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.landing-section-heading > * + * {
		margin-right: 1rem;
	}

	.landing-section-kicker {
		color: var(--ui-color-primary);
	}

	.landing-section-heading h2,
	.landing-cta h2 {
		margin: 0.65rem 0 0;
		font-size: 2rem;
		font-weight: 950;
		line-height: 1.45;
	}

	.landing-section-heading p,
	.landing-cta p {
		margin: 0.5rem 0 0;
		color: var(--ui-color-text-muted);
		line-height: 1.8;
	}

	.landing-history-grid,
	.landing-public-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 1rem;
		align-items: start;
	}

	.landing-history-grid :global(.ui-card) {
		border-radius: 1.25rem;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-empty-card {
		min-height: 13rem;
		padding: 1.25rem;
		border: 1px dashed var(--ui-color-border-strong);
		border-radius: 1.25rem;
		background: var(--ui-color-surface-muted);
		text-align: center;
	}

	.landing-empty-icon {
		display: flex;
		width: 3.5rem;
		height: 3.5rem;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		border-radius: 9999px;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.landing-empty-icon :global(svg) {
		width: 1.65rem;
		height: 1.65rem;
	}

	.landing-empty-card h3 {
		margin: 1rem 0 0;
		font-size: 1rem;
	}

	.landing-empty-card p {
		margin: 0.4rem 0 1rem;
		color: var(--ui-color-text-muted);
		font-size: 0.8rem;
		line-height: 1.7;
	}

	.landing-public-card {
		border: 1px solid var(--ui-color-border);
		border-radius: 1.5rem;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
		overflow: hidden;
	}

	.landing-public-card-featured {
		border-color: var(--ui-color-border-strong);
		background: linear-gradient(
			180deg,
			var(--ui-color-primary-soft),
			var(--ui-color-surface) 12rem
		);
	}

	.landing-featured-showcase {
		position: relative;
		margin-bottom: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: 2rem;
		background: linear-gradient(
			145deg,
			var(--ui-color-accent-soft),
			var(--ui-color-surface-raised) 22rem
		);
		box-shadow: var(--ui-shadow-md);
		overflow: hidden;
	}

	.landing-featured-heading {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}

	.landing-featured-heading > * + * {
		margin-right: 0.85rem;
	}

	.landing-featured-icon {
		display: flex;
		width: 3.25rem;
		height: 3.25rem;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: 1rem;
		background: var(--ui-color-surface-raised);
		color: var(--ui-color-accent);
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-featured-icon :global(svg) {
		width: 1.65rem;
		height: 1.65rem;
	}

	.landing-featured-kicker {
		color: var(--ui-color-accent);
		font-size: 0.75rem;
		font-weight: 900;
	}

	.landing-featured-heading h3 {
		margin: 0.2rem 0 0;
		font-size: 1.4rem;
		font-weight: 950;
	}

	.landing-featured-heading p {
		margin: 0.25rem 0 0;
		color: var(--ui-color-text-muted);
		font-size: 0.85rem;
		line-height: 1.7;
	}

	.landing-featured-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 0.85rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.landing-featured-grid :global(.ui-khatm-list-card) {
		height: 100%;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
	}

	.landing-public-header {
		display: flex;
		min-height: 8rem;
		align-items: flex-start;
		justify-content: space-between;
		padding: 1.25rem;
	}

	.landing-public-header > * + * {
		margin-right: 0.75rem;
	}

	.landing-public-icon {
		display: flex;
		width: 2.5rem;
		height: 2.5rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.85rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}

	.landing-public-card-featured .landing-public-icon {
		background: var(--ui-color-accent-soft);
		color: var(--ui-color-accent);
	}

	.landing-public-header h3 {
		margin: 0.8rem 0 0;
		font-size: 1.15rem;
		font-weight: 900;
	}

	.landing-public-header p {
		margin: 0.25rem 0 0;
		color: var(--ui-color-text-muted);
		font-size: 0.8rem;
	}

	.landing-public-list {
		margin: 0;
		padding: 0 1rem 1rem;
		list-style: none;
	}

	.landing-khatm-card-list {
		padding: 0 1rem 1rem;
	}

	.landing-public-list li + li {
		border-top: 1px solid var(--ui-color-border);
	}

	.landing-public-list a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 0.5rem;
		border-radius: 0.75rem;
		color: var(--ui-color-text);
		text-decoration: none;
		transition: background-color 160ms ease;
	}

	.landing-public-list a:hover {
		background: var(--ui-color-primary-soft);
	}

	.landing-list-main {
		min-width: 0;
	}

	.landing-list-main > strong {
		display: block;
		max-width: 15rem;
		overflow: hidden;
		font-size: 0.86rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.landing-list-main > span {
		display: flex;
		align-items: center;
		margin-top: 0.35rem;
	}

	.landing-list-hint {
		margin-right: 0.4rem;
		color: var(--ui-color-text-muted);
		font-size: 0.67rem;
	}

	.landing-list-progress {
		width: 3.5rem;
		flex: 0 0 3.5rem;
		margin-right: 0.75rem;
		text-align: left;
	}

	.landing-list-progress strong {
		display: block;
		margin-bottom: 0.3rem;
		font-size: 0.75rem;
	}

	.landing-list-progress progress {
		height: 0.35rem;
	}

	.landing-section-heading-centered {
		justify-content: center;
		text-align: center;
	}

	.landing-steps {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: landing-step;
	}

	.landing-steps li {
		position: relative;
		padding: 1.5rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1.5rem;
		background: var(--ui-color-surface-muted);
		text-align: center;
	}

	.landing-step-number {
		display: flex;
		width: 3rem;
		height: 3rem;
		align-items: center;
		justify-content: center;
		margin: 0 auto;
		border-radius: 1rem;
		background: var(--ui-color-primary);
		color: var(--ui-color-on-primary);
		font-size: 1.1rem;
		font-weight: 900;
		box-shadow: 0 8px 18px var(--ui-color-focus);
	}

	.landing-steps h3 {
		margin: 1rem 0 0;
		font-size: 1.05rem;
		font-weight: 900;
	}

	.landing-steps p {
		margin: 0.45rem 0 0;
		color: var(--ui-color-text-muted);
		font-size: 0.82rem;
		line-height: 1.8;
	}

	.landing-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 4rem;
		padding: 2.25rem;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: var(--ui-radius-xl);
		background: linear-gradient(
			135deg,
			var(--ui-color-landing-hero-end),
			var(--ui-color-landing-hero)
		);
		color: var(--ui-color-landing-hero-text);
		box-shadow: var(--ui-shadow-lg);
	}

	.landing-cta > * + * {
		margin-right: 2rem;
	}

	.landing-cta > div {
		max-width: 42rem;
	}

	.landing-section-kicker-light,
	.landing-cta p {
		color: var(--ui-color-landing-hero-muted);
	}

	@media (max-width: 1023px) {
		.landing-hero {
			grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.75fr);
			grid-gap: 1.75rem;
			padding: 2.5rem;
		}

		.landing-hero h1 {
			font-size: 2.8rem;
		}

		.landing-floating-card {
			display: none;
		}

		.landing-features {
			margin-right: 1rem;
			margin-left: 1rem;
		}

		.landing-feature-card {
			display: block;
		}

		.landing-feature-card > * + * {
			margin-top: 0.8rem;
			margin-right: 0;
		}

		.landing-history-grid,
		.landing-public-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.landing-featured-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 767px) {
		.landing-page {
			padding-top: 0.75rem;
		}

		.landing-hero {
			grid-template-columns: minmax(0, 1fr);
			grid-gap: 1.5rem;
			min-height: 0;
			padding: 1.5rem 1.25rem 2.5rem;
			border-radius: 1.5rem;
			text-align: center;
		}

		.landing-hero-copy {
			display: flex;
			align-items: center;
			flex-direction: column;
		}

		.landing-hero h1 {
			font-size: 2.35rem;
			line-height: 1.35;
		}

		.landing-hero-copy > p {
			font-size: 0.95rem;
			line-height: 1.9;
		}

		.landing-hero-actions {
			width: 100%;
			flex-direction: column;
		}

		.landing-hero-actions > * {
			width: 100%;
		}

		.landing-hero-actions > * + * {
			margin-top: 0.65rem;
			margin-right: 0;
		}

		.landing-hero-points {
			justify-content: center;
		}

		.landing-visual {
			max-width: 20rem;
			order: -1;
		}

		.landing-image-frame {
			padding: 0.45rem;
			border-radius: 1.5rem;
			transform: none;
		}

		.landing-image-frame img {
			max-height: 20rem;
			border-radius: 1.1rem;
		}

		.landing-features,
		.landing-history-grid,
		.landing-public-grid,
		.landing-featured-grid,
		.landing-steps {
			grid-template-columns: minmax(0, 1fr);
		}

		.landing-stat-total-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.landing-features {
			margin: -1.5rem 0.75rem 0;
		}

		.landing-feature-card {
			display: flex;
		}

		.landing-feature-card > * + * {
			margin-top: 0;
			margin-right: 0.85rem;
		}

		.landing-section {
			padding-top: 3.25rem;
		}

		.landing-personal {
			margin-top: 2.75rem;
			padding: 1.25rem;
			border-radius: 1.5rem;
		}

		.landing-section-heading {
			align-items: flex-start;
			flex-direction: column;
		}

		.landing-section-heading > * + * {
			margin-top: 1rem;
			margin-right: 0;
		}

		.landing-section-heading h2,
		.landing-cta h2 {
			font-size: 1.55rem;
		}

		.landing-section-heading-centered {
			align-items: center;
		}

		.landing-public-header {
			min-height: 0;
		}

		.landing-featured-showcase {
			padding: 1.1rem;
			border-radius: 1.5rem;
		}

		.landing-daily-panel {
			padding: 1.25rem 1rem;
		}

		.landing-daily-heading {
			align-items: stretch;
			flex-direction: column;
		}

		.landing-daily-summary {
			display: flex;
			align-items: baseline;
			justify-content: center;
			margin-top: 1rem;
		}

		.landing-daily-summary > * + * {
			margin-right: 0.4rem;
		}

		.landing-daily-legend {
			align-items: flex-start;
			flex-wrap: wrap;
			line-height: 1.8;
		}

		.landing-daily-legend > * + * {
			margin-right: 0.75rem;
		}

		.landing-daily-chart-frame {
			padding-right: 0.45rem;
			padding-left: 0.45rem;
		}

		.landing-daily-grid-lines {
			right: 0.45rem;
			left: 0.45rem;
			height: 9.5rem;
		}

		.landing-daily-list {
			grid-gap: 0.15rem;
		}

		.landing-daily-list > li {
			grid-template-rows: 9.5rem 3rem 1.65rem;
		}

		.landing-daily-bar-column {
			padding: 0 0.15rem;
		}

		.landing-daily-bar-column strong {
			padding: 0.1rem 0.2rem;
			font-size: 0.6rem;
		}

		.landing-daily-bar {
			max-width: 2rem;
		}

		.landing-daily-list time strong {
			font-size: 0.62rem;
		}

		.landing-daily-list time span {
			font-size: 0.54rem;
		}

		.landing-daily-details div + div {
			margin-right: 0.15rem;
		}

		.landing-daily-details dd {
			padding: 0.12rem 0.2rem;
			font-size: 0.58rem;
		}

		.landing-daily-details dd::before {
			width: 0.3rem;
			height: 0.3rem;
			margin-left: 0.15rem;
		}

		.landing-steps li {
			padding: 1.5rem;
		}

		.landing-cta {
			align-items: stretch;
			flex-direction: column;
			margin-top: 3.25rem;
			padding: 2rem 1.25rem;
			border-radius: 1.5rem;
			text-align: center;
		}

		.landing-cta > * + * {
			margin-top: 1.5rem;
			margin-right: 0;
		}
	}

	@media (max-width: 419px) {
		.landing-hero {
			padding-right: 1rem;
			padding-left: 1rem;
		}

		.landing-hero h1 {
			font-size: 2rem;
		}

		.landing-eyebrow {
			font-size: 0.7rem;
		}

		.landing-feature-card {
			padding: 1rem;
		}

		.landing-stat-total-card .ui-card-body {
			align-items: flex-start;
			padding: 1.25rem;
		}

		.landing-stat-total-icon {
			width: 3.25rem;
			height: 3.25rem;
			flex-basis: 3.25rem;
		}

		.landing-stat-total-value {
			font-size: 1.9rem;
		}

		.landing-list-hint {
			display: none;
		}
	}
</style>
