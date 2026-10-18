<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import Header from '$lib/components/Header.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { Zekr } from '$lib/entity/Zekr.svelte'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime.js'
	import { localeTag } from '$lib/i18n/format'
	import * as m from '$lib/paraglide/messages.js'
	import type { PageProps } from './$types'
	import HistoryKhatm from './history/history-khatm.svelte'
	import HistoryPickedRange from './history/history-picked-range.svelte'
	import HistoryZekr from './history/history-zekr.svelte'
	import SeoHead from '$lib/components/SeoHead.svelte'

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
		data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, getLocale(), base),
	)
	const maximumDailyAyahs = $derived(
		Math.max(1, ...statistics.daily.map((item) => item.recitedAyahs)),
	)
	const weeklyRecitedAyahs = $derived(
		statistics.daily.reduce((total, item) => total + item.recitedAyahs, 0),
	)
	const dailyWeekdayFormatter = new Intl.DateTimeFormat(localeTag(), {
		weekday: 'short',
		timeZone: 'UTC',
	})
	const dailyDateFormatter = new Intl.DateTimeFormat(localeTag(), {
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

<SeoHead
	meta={{
		title: branding.seoTitle,
		description: branding.seoDescription,
		canonicalPath: page.url.pathname,
		imagePath: `/og/home.png?l=${data.locale}&v=${encodeURIComponent(branding.revision)}`,
		imageAlt: branding.name,
		locale: data.locale,
		jsonLd: [
			{
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: branding.name,
				url: page.url.href,
				inLanguage: data.locale,
			},
			{
				'@context': 'https://schema.org',
				'@type': 'WebApplication',
				name: branding.name,
				description: branding.seoDescription,
				applicationCategory: 'LifestyleApplication',
				operatingSystem: 'Web',
				url: page.url.href,
			},
		],
	}}
/>

<Header />

<div class="ui-landing-page">
	<section class="ui-landing-hero" aria-labelledby="landing-title">
		<div class="ui-landing-orb ui-landing-orb-one" aria-hidden="true"></div>
		<div class="ui-landing-orb ui-landing-orb-two" aria-hidden="true"></div>

		<div class="ui-landing-hero-copy">
			<span class="ui-landing-eyebrow">
				<IconAutoAwesome class="size-5" />
				{m.home_eyebrow()}
			</span>
			<h1 id="landing-title">{branding.heroTitle}<br /><span>{branding.heroHighlight}</span></h1>
			<p>{branding.heroDescription}</p>
			<div class="ui-landing-hero-actions">
				<a class="ui-btn ui-btn-xl ui-landing-primary-action" href={localizeHref(`${base}/add`)}>
					<IconAdd class="size-6" />
					{m.nav_create()}
				</a>
				<a class="ui-btn ui-btn-xl ui-landing-secondary-action" href={localizeHref(`${base}/list`)}>
					{m.home_view_public()}
					<IconArrow class="ltr:mirror size-5" />
				</a>
			</div>
			<div class="ui-landing-hero-points" aria-label={m.home_features_label()}>
				<span><IconCheck /> {m.home_point_ranges()}</span>
				<span><IconCheck /> {m.home_point_progress()}</span>
				<span><IconCheck /> {m.home_point_link()}</span>
			</div>
		</div>

		<div class="ui-landing-visual">
			<div class="ui-landing-image-frame">
				<img
					src={branding.heroImageUrl}
					width="480"
					alt={branding.heroImageAlt}
					decoding="async"
					fetchpriority="high"
				/>
			</div>
			<div class="ui-landing-floating-card ui-landing-floating-top">
				<span class="ui-landing-floating-icon"><IconGroups /></span>
				<span
					><strong>{m.home_start_together()}</strong><small>{m.home_start_together_hint()}</small
					></span
				>
			</div>
			<div class="ui-landing-floating-card ui-landing-floating-bottom">
				<span class="ui-landing-progress-mark"><IconCheck /></span>
				<span><strong>{m.home_clear_path()}</strong><small>{m.home_clear_path_hint()}</small></span>
			</div>
		</div>
	</section>

	<section class="ui-landing-features" aria-label={m.home_why()}>
		<article class="ui-landing-feature-card">
			<span class="ui-landing-feature-icon ui-landing-feature-icon-purple"><IconMenuBook /></span>
			<div>
				<h2>{m.home_feature_share_title()}</h2>
				<p>{m.home_feature_share_text()}</p>
			</div>
		</article>
		<article class="ui-landing-feature-card">
			<span class="ui-landing-feature-icon ui-landing-feature-icon-green"><IconStats /></span>
			<div>
				<h2>{m.home_feature_progress_title()}</h2>
				<p>{m.home_feature_progress_text()}</p>
			</div>
		</article>
		<article class="ui-landing-feature-card">
			<span class="ui-landing-feature-icon ui-landing-feature-icon-gold"><IconShare /></span>
			<div>
				<h2>{m.home_feature_invite_title()}</h2>
				<p>{m.home_feature_invite_text()}</p>
			</div>
		</article>
	</section>

	<section class="ui-landing-section ui-landing-statistics" aria-labelledby="statistics-title">
		<div class="ui-landing-section-heading">
			<div>
				<span class="ui-landing-section-kicker"><IconStats /> {m.home_statistics_title()}</span>
				<h2 id="statistics-title">{m.home_statistics_title()}</h2>
				<p>{m.home_statistics_description()}</p>
			</div>
		</div>

		<div class="ui-landing-stat-total-grid">
			<article class="ui-card ui-card-bordered ui-landing-stat-total-card">
				<div class="ui-card-body">
					<span
						class="ui-landing-stat-total-icon ui-landing-stat-total-icon-primary"
						aria-hidden="true"
					>
						<IconMenuBook />
					</span>
					<div>
						<p class="ui-landing-stat-total-label">{m.home_stats_recited_label()}</p>
						<strong class="ui-landing-stat-total-value">
							{statistics.totals.recitedAyahs.toLocaleString(localeTag())}
						</strong>
						<p class="ui-landing-stat-total-description">{m.home_stats_recited_description()}</p>
					</div>
				</div>
			</article>
			<article class="ui-card ui-card-bordered ui-landing-stat-total-card">
				<div class="ui-card-body">
					<span
						class="ui-landing-stat-total-icon ui-landing-stat-total-icon-success"
						aria-hidden="true"
					>
						<IconCheck />
					</span>
					<div>
						<p class="ui-landing-stat-total-label">{m.home_stats_rounds_label()}</p>
						<strong class="ui-landing-stat-total-value">
							{statistics.totals.completedRounds.toLocaleString(localeTag())}
						</strong>
						<p class="ui-landing-stat-total-description">{m.home_stats_rounds_description()}</p>
					</div>
				</div>
			</article>
		</div>

		<div class="ui-landing-daily-panel">
			<div class="ui-landing-daily-heading">
				<div class="ui-landing-daily-title">
					<span class="ui-landing-daily-heading-icon" aria-hidden="true"><IconCalendar /></span>
					<div>
						<h3>{m.home_daily_title()}</h3>
						<p>{m.home_daily_description()}</p>
					</div>
				</div>
				<div class="ui-landing-daily-summary">
					<strong>{weeklyRecitedAyahs.toLocaleString(localeTag())}</strong>
					<span>{m.home_weekly_ayahs()}</span>
				</div>
			</div>

			<div class="ui-landing-daily-legend" aria-label={m.home_chart_legend()}>
				<span class="ui-landing-daily-legend-ayah">{m.home_legend_ayah()}</span>
				<span class="ui-landing-daily-legend-created">{m.home_legend_created()}</span>
				<span class="ui-landing-daily-legend-completed">{m.home_legend_completed()}</span>
			</div>

			<div class="ui-landing-daily-chart-frame">
				<div class="ui-landing-daily-grid-lines" aria-hidden="true">
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
				<ul class="ui-landing-daily-list" aria-label={m.home_statistics_daily_label()}>
					{#each statistics.daily as item}
						<li>
							<div class="ui-landing-daily-bar-column">
								<strong>{item.recitedAyahs.toLocaleString(localeTag())}</strong>
								<span
									class="ui-landing-daily-bar h-[var(--bar-height)]"
									style:--bar-height={`${dailyBarHeight(item.recitedAyahs)}%`}
									aria-hidden="true"
								></span>
							</div>
							<time datetime={item.date}>
								<strong>{formatDailyWeekday(item.date)}</strong>
								<span>{formatDailyShortDate(item.date)}</span>
							</time>
							<dl class="ui-landing-daily-details">
								<div>
									<dt class="ui-sr-only">{m.home_legend_created()}</dt>
									<dd>{item.createdKhatms.toLocaleString(localeTag())}</dd>
								</div>
								<div>
									<dt class="ui-sr-only">{m.home_legend_completed()}</dt>
									<dd>{item.completedRounds.toLocaleString(localeTag())}</dd>
								</div>
							</dl>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section class="ui-landing-section ui-landing-personal" aria-labelledby="personal-title">
		<div class="ui-landing-section-heading">
			<div>
				<span class="ui-landing-section-kicker"><IconHistory /> {m.home_personal_kicker()}</span>
				<h2 id="personal-title">{m.home_personal_title()}</h2>
				<p>{m.home_personal_description()}</p>
			</div>
			<a class="ui-btn ui-btn-ghost" href={localizeHref(`${base}/history`)}>
				{m.home_history_link()}
				<IconArrow class="ltr:mirror size-5" />
			</a>
		</div>

		<div class="ui-landing-history-grid">
			<HistoryKhatm limit={3} title={m.home_created_title()}>
				{#snippet fallback()}
					<article class="ui-landing-empty-card">
						<span class="ui-landing-empty-icon"><IconAdd /></span>
						<h3>{m.home_no_created()}</h3>
						<p>{m.home_first_group()}</p>
						<a class="ui-btn ui-btn-soft ui-btn-sm" href={localizeHref(`${base}/add`)}
							>{m.home_create_first()}</a
						>
					</article>
				{/snippet}
			</HistoryKhatm>
			<HistoryZekr limit={3} title={m.history_zekr()} />
			<HistoryPickedRange limit={3} title={m.history_latest_picks()}>
				{#snippet fallback()}
					<article class="ui-landing-empty-card">
						<span class="ui-landing-empty-icon"><IconMenuBook /></span>
						<h3>{m.home_no_picked()}</h3>
						<p>{m.home_join_public()}</p>
						<a class="ui-btn ui-btn-soft ui-btn-sm" href={localizeHref(`${base}/list`)}
							>{m.home_view_khatms()}</a
						>
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
		<section class:ui-landing-public-card-featured={featured} class="ui-landing-public-card">
			<div class="ui-landing-public-header">
				<div>
					<span class="ui-landing-public-icon">
						{#if featured}<IconAutoAwesome />{:else}<IconGroups />{/if}
					</span>
					<h3>{title}</h3>
					<p>{description}</p>
				</div>
				{#if moreLink}
					<a href={moreLink} class="ui-btn ui-btn-ghost ui-btn-sm">
						{m.home_view_all()}
						<IconMore class="size-5 -scale-x-100" />
					</a>
				{/if}
			</div>
			<ul class="ui-khatm-card-list ui-landing-khatm-card-list">
				{#each items.slice(0, 6) as khatm}
					<li>
						<KhatmListCard {khatm} meta={m.home_join_signin()} />
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{#if featuredKhatms.length > 0 || showcase.length > 0 || khatms.length > 0 || zekrList.length > 0}
		<section class="ui-landing-section" aria-labelledby="public-title">
			<div class="ui-landing-section-heading">
				<div>
					<span class="ui-landing-section-kicker"><IconGroups /> {m.home_public_kicker()}</span>
					<h2 id="public-title">{m.home_public_title()}</h2>
					<p>{m.home_public_description()}</p>
				</div>
			</div>

			{#if featuredKhatms.length > 0}
				<section class="ui-landing-featured-showcase" aria-labelledby="featured-khatms-title">
					<div class="ui-landing-featured-heading">
						<span class="ui-landing-featured-icon" aria-hidden="true"><IconStar /></span>
						<div>
							<span class="ui-landing-featured-kicker">{m.home_featured_kicker()}</span>
							<h3 id="featured-khatms-title">{m.home_featured_title()}</h3>
							<p>{m.home_featured_description()}</p>
						</div>
					</div>
					<ul class="ui-landing-featured-grid">
						{#each featuredKhatms as khatm (khatm.id)}
							<li>
								<KhatmListCard {khatm} meta={m.home_featured_meta()} showDescription />
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<div class="ui-landing-public-grid">
				{#if showcase.length > 0}
					{@render khatmList(
						showcase,
						m.home_showcase_title(),
						m.home_showcase_description(),
						undefined,
						true,
					)}
				{/if}
				{#if khatms.length > 0}
					{@render khatmList(
						khatms,
						m.home_recent_title(),
						m.home_recent_description(),
						`${base}/list`,
					)}
				{/if}

				{#if zekrList.length > 0}
					<section class="ui-landing-public-card">
						<div class="ui-landing-public-header">
							<div>
								<span class="ui-landing-public-icon"><IconAutoAwesome /></span>
								<h3>{m.home_zekr_title()}</h3>
								<p>{m.home_zekr_description()}</p>
							</div>
						</div>
						<ul class="ui-landing-public-list">
							{#each zekrList.slice(0, 6) as zekr}
								<li>
									<a href={zekr.link}>
										<span class="ui-landing-list-main">
											<strong>{zekr.title}</strong>
											<span>
												{#if zekr.isFinite}
													<span class="ui-badge ui-badge-info ui-badge-xs"
														>{m.home_zekr_count({
															count: zekr.targetCount.toLocaleString(localeTag()),
														})}</span
													>
												{/if}
												<span class="ui-landing-list-hint">{m.home_zekr_registered()}</span>
											</span>
										</span>
										<span class="ui-landing-list-progress">
											<strong>{zekr.count.toLocaleString(localeTag())}</strong>
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

	<section class="ui-landing-section landing-how" aria-labelledby="how-title">
		<div class="ui-landing-section-heading ui-landing-section-heading-centered">
			<div>
				<span class="ui-landing-section-kicker"><IconMenuBook /> {m.home_how_kicker()}</span>
				<h2 id="how-title">{m.home_how_title()}</h2>
				<p>{m.home_how_description()}</p>
			</div>
		</div>
		<ol class="ui-landing-steps">
			<li>
				<span class="ui-landing-step-number">۱</span>
				<h3>{m.home_step_create()}</h3>
				<p>{m.home_step_create_description()}</p>
			</li>
			<li>
				<span class="ui-landing-step-number">۲</span>
				<h3>{m.home_step_invite()}</h3>
				<p>{m.home_step_invite_description()}</p>
			</li>
			<li>
				<span class="ui-landing-step-number">۳</span>
				<h3>{m.home_step_finish()}</h3>
				<p>{m.home_step_finish_description()}</p>
			</li>
		</ol>
	</section>

	<section class="ui-landing-cta" aria-labelledby="cta-title">
		<div>
			<span class="ui-landing-section-kicker ui-landing-section-kicker-light"
				><IconAutoAwesome /> {m.home_cta_kicker()}</span
			>
			<h2 id="cta-title">{m.home_cta_title()}</h2>
			<p>{m.home_cta_description()}</p>
		</div>
		<a class="ui-btn ui-btn-xl ui-landing-primary-action" href={localizeHref(`${base}/add`)}>
			<IconAdd class="size-6" />
			{m.home_cta_action()}
		</a>
	</section>
</div>
