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

<svelte:head>
	<title>{branding.seoTitle}</title>
	<meta name="description" content={branding.seoDescription} />
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
				{m.home_eyebrow()}
			</span>
			<h1 id="landing-title">{branding.heroTitle}<br /><span>{branding.heroHighlight}</span></h1>
			<p>{branding.heroDescription}</p>
			<div class="landing-hero-actions">
				<a class="ui-btn ui-btn-xl landing-primary-action" href={localizeHref(`${base}/add`)}>
					<IconAdd class="size-6" />
					{m.nav_create()}
				</a>
				<a class="ui-btn ui-btn-xl landing-secondary-action" href={localizeHref(`${base}/list`)}>
					{m.home_view_public()}
					<IconArrow class="ltr:mirror size-5" />
				</a>
			</div>
			<div class="landing-hero-points" aria-label={m.home_features_label()}>
				<span><IconCheck /> {m.home_point_ranges()}</span>
				<span><IconCheck /> {m.home_point_progress()}</span>
				<span><IconCheck /> {m.home_point_link()}</span>
			</div>
		</div>

		<div class="landing-visual">
			<div class="landing-image-frame">
				<img src={branding.heroImageUrl} width="480" alt={branding.heroImageAlt} />
			</div>
			<div class="landing-floating-card landing-floating-top">
				<span class="landing-floating-icon"><IconGroups /></span>
				<span
					><strong>{m.home_start_together()}</strong><small>{m.home_start_together_hint()}</small
					></span
				>
			</div>
			<div class="landing-floating-card landing-floating-bottom">
				<span class="landing-progress-mark"><IconCheck /></span>
				<span><strong>{m.home_clear_path()}</strong><small>{m.home_clear_path_hint()}</small></span>
			</div>
		</div>
	</section>

	<section class="landing-features" aria-label={m.home_why()}>
		<article class="landing-feature-card">
			<span class="landing-feature-icon landing-feature-icon-purple"><IconMenuBook /></span>
			<div>
				<h2>{m.home_feature_share_title()}</h2>
				<p>{m.home_feature_share_text()}</p>
			</div>
		</article>
		<article class="landing-feature-card">
			<span class="landing-feature-icon landing-feature-icon-green"><IconStats /></span>
			<div>
				<h2>{m.home_feature_progress_title()}</h2>
				<p>{m.home_feature_progress_text()}</p>
			</div>
		</article>
		<article class="landing-feature-card">
			<span class="landing-feature-icon landing-feature-icon-gold"><IconShare /></span>
			<div>
				<h2>{m.home_feature_invite_title()}</h2>
				<p>{m.home_feature_invite_text()}</p>
			</div>
		</article>
	</section>

	<section class="landing-section landing-statistics" aria-labelledby="statistics-title">
		<div class="landing-section-heading">
			<div>
				<span class="landing-section-kicker"><IconStats /> {m.home_statistics_title()}</span>
				<h2 id="statistics-title">{m.home_statistics_title()}</h2>
				<p>{m.home_statistics_description()}</p>
			</div>
		</div>

		<div class="landing-stat-total-grid">
			<article class="ui-card ui-card-bordered landing-stat-total-card">
				<div class="ui-card-body">
					<span class="landing-stat-total-icon landing-stat-total-icon-primary" aria-hidden="true">
						<IconMenuBook />
					</span>
					<div>
						<p class="landing-stat-total-label">{m.home_stats_recited_label()}</p>
						<strong class="landing-stat-total-value">
							{statistics.totals.recitedAyahs.toLocaleString(localeTag())}
						</strong>
						<p class="landing-stat-total-description">{m.home_stats_recited_description()}</p>
					</div>
				</div>
			</article>
			<article class="ui-card ui-card-bordered landing-stat-total-card">
				<div class="ui-card-body">
					<span class="landing-stat-total-icon landing-stat-total-icon-success" aria-hidden="true">
						<IconCheck />
					</span>
					<div>
						<p class="landing-stat-total-label">{m.home_stats_rounds_label()}</p>
						<strong class="landing-stat-total-value">
							{statistics.totals.completedRounds.toLocaleString(localeTag())}
						</strong>
						<p class="landing-stat-total-description">{m.home_stats_rounds_description()}</p>
					</div>
				</div>
			</article>
		</div>

		<div class="landing-daily-panel">
			<div class="landing-daily-heading">
				<div class="landing-daily-title">
					<span class="landing-daily-heading-icon" aria-hidden="true"><IconCalendar /></span>
					<div>
						<h3>{m.home_daily_title()}</h3>
						<p>{m.home_daily_description()}</p>
					</div>
				</div>
				<div class="landing-daily-summary">
					<strong>{weeklyRecitedAyahs.toLocaleString(localeTag())}</strong>
					<span>{m.home_weekly_ayahs()}</span>
				</div>
			</div>

			<div class="landing-daily-legend" aria-label={m.home_chart_legend()}>
				<span class="landing-daily-legend-ayah">{m.home_legend_ayah()}</span>
				<span class="landing-daily-legend-created">{m.home_legend_created()}</span>
				<span class="landing-daily-legend-completed">{m.home_legend_completed()}</span>
			</div>

			<div class="landing-daily-chart-frame">
				<div class="landing-daily-grid-lines" aria-hidden="true">
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
				<ul class="landing-daily-list" aria-label={m.home_statistics_daily_label()}>
					{#each statistics.daily as item}
						<li>
							<div class="landing-daily-bar-column">
								<strong>{item.recitedAyahs.toLocaleString(localeTag())}</strong>
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

	<section class="landing-section landing-personal" aria-labelledby="personal-title">
		<div class="landing-section-heading">
			<div>
				<span class="landing-section-kicker"><IconHistory /> {m.home_personal_kicker()}</span>
				<h2 id="personal-title">{m.home_personal_title()}</h2>
				<p>{m.home_personal_description()}</p>
			</div>
			<a class="ui-btn ui-btn-ghost" href={localizeHref(`${base}/history`)}>
				{m.home_history_link()}
				<IconArrow class="ltr:mirror size-5" />
			</a>
		</div>

		<div class="landing-history-grid">
			<HistoryKhatm limit={3} title={m.home_created_title()}>
				{#snippet fallback()}
					<article class="landing-empty-card">
						<span class="landing-empty-icon"><IconAdd /></span>
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
					<article class="landing-empty-card">
						<span class="landing-empty-icon"><IconMenuBook /></span>
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
						{m.home_view_all()}
						<IconMore class="size-5 -scale-x-100" />
					</a>
				{/if}
			</div>
			<ul class="ui-khatm-card-list landing-khatm-card-list">
				{#each items.slice(0, 6) as khatm}
					<li>
						<KhatmListCard {khatm} meta={m.home_join_signin()} />
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{#if featuredKhatms.length > 0 || showcase.length > 0 || khatms.length > 0 || zekrList.length > 0}
		<section class="landing-section" aria-labelledby="public-title">
			<div class="landing-section-heading">
				<div>
					<span class="landing-section-kicker"><IconGroups /> {m.home_public_kicker()}</span>
					<h2 id="public-title">{m.home_public_title()}</h2>
					<p>{m.home_public_description()}</p>
				</div>
			</div>

			{#if featuredKhatms.length > 0}
				<section class="landing-featured-showcase" aria-labelledby="featured-khatms-title">
					<div class="landing-featured-heading">
						<span class="landing-featured-icon" aria-hidden="true"><IconStar /></span>
						<div>
							<span class="landing-featured-kicker">{m.home_featured_kicker()}</span>
							<h3 id="featured-khatms-title">{m.home_featured_title()}</h3>
							<p>{m.home_featured_description()}</p>
						</div>
					</div>
					<ul class="landing-featured-grid">
						{#each featuredKhatms as khatm (khatm.id)}
							<li>
								<KhatmListCard {khatm} meta={m.home_featured_meta()} showDescription />
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<div class="landing-public-grid">
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
					<section class="landing-public-card">
						<div class="landing-public-header">
							<div>
								<span class="landing-public-icon"><IconAutoAwesome /></span>
								<h3>{m.home_zekr_title()}</h3>
								<p>{m.home_zekr_description()}</p>
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
														>{m.home_zekr_count({
															count: zekr.targetCount.toLocaleString(localeTag()),
														})}</span
													>
												{/if}
												<span class="landing-list-hint">{m.home_zekr_registered()}</span>
											</span>
										</span>
										<span class="landing-list-progress">
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

	<section class="landing-section landing-how" aria-labelledby="how-title">
		<div class="landing-section-heading landing-section-heading-centered">
			<div>
				<span class="landing-section-kicker"><IconMenuBook /> {m.home_how_kicker()}</span>
				<h2 id="how-title">{m.home_how_title()}</h2>
				<p>{m.home_how_description()}</p>
			</div>
		</div>
		<ol class="landing-steps">
			<li>
				<span class="landing-step-number">۱</span>
				<h3>{m.home_step_create()}</h3>
				<p>{m.home_step_create_description()}</p>
			</li>
			<li>
				<span class="landing-step-number">۲</span>
				<h3>{m.home_step_invite()}</h3>
				<p>{m.home_step_invite_description()}</p>
			</li>
			<li>
				<span class="landing-step-number">۳</span>
				<h3>{m.home_step_finish()}</h3>
				<p>{m.home_step_finish_description()}</p>
			</li>
		</ol>
	</section>

	<section class="landing-cta" aria-labelledby="cta-title">
		<div>
			<span class="landing-section-kicker landing-section-kicker-light"
				><IconAutoAwesome /> {m.home_cta_kicker()}</span
			>
			<h2 id="cta-title">{m.home_cta_title()}</h2>
			<p>{m.home_cta_description()}</p>
		</div>
		<a class="ui-btn ui-btn-xl landing-primary-action" href={localizeHref(`${base}/add`)}>
			<IconAdd class="size-6" />
			{m.home_cta_action()}
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
		margin-inline-start: 0.4rem;
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
		margin-inline-start: 0.75rem;
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
		margin-inline-end: 1rem;
	}

	.landing-hero-points :global(svg) {
		width: 1rem;
		height: 1rem;
		margin-inline-end: 0.3rem;
		color: var(--ui-color-landing-accent);
	}

	.landing-visual {
		max-width: 28rem;
		margin-inline-start: auto;
		margin-inline-end: auto;
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
		margin-inline-start: auto;
		margin-inline-end: auto;
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
		margin-inline-start: 0.7rem;
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
		margin-inline-start: 0.85rem;
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
		margin-inline-start: 1rem;
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
		margin-inline-start: 0.75rem;
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
		margin-inline-start: 1.1rem;
	}

	.landing-daily-legend span {
		display: inline-flex;
		align-items: center;
	}

	.landing-daily-legend span::before {
		display: inline-block;
		width: 0.55rem;
		height: 0.55rem;
		margin-inline-end: 0.4rem;
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
		margin-inline-start: 0.35rem;
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
		margin-inline-end: 0.25rem;
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
		margin-inline-start: 1rem;
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
		margin-inline-start: 0.85rem;
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
		margin-inline-start: 0.75rem;
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
		margin-inline-start: 0.4rem;
		color: var(--ui-color-text-muted);
		font-size: 0.67rem;
	}

	.landing-list-progress {
		width: 3.5rem;
		flex: 0 0 3.5rem;
		margin-inline-start: 0.75rem;
		text-align: end;
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
		margin-inline-start: 2rem;
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
			margin-inline-start: 1rem;
			margin-inline-end: 1rem;
		}

		.landing-feature-card {
			display: block;
		}

		.landing-feature-card > * + * {
			margin-top: 0.8rem;
			margin-inline-start: 0;
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
			margin-inline-start: 0;
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
			margin-inline-start: 0.85rem;
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
			margin-inline-start: 0;
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
			margin-inline-start: 0.4rem;
		}

		.landing-daily-legend {
			align-items: flex-start;
			flex-wrap: wrap;
			line-height: 1.8;
		}

		.landing-daily-legend > * + * {
			margin-inline-start: 0.75rem;
		}

		.landing-daily-chart-frame {
			padding-inline-start: 0.45rem;
			padding-inline-end: 0.45rem;
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
			margin-inline-start: 0.15rem;
		}

		.landing-daily-details dd {
			padding: 0.12rem 0.2rem;
			font-size: 0.58rem;
		}

		.landing-daily-details dd::before {
			width: 0.3rem;
			height: 0.3rem;
			margin-inline-end: 0.15rem;
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
			margin-inline-start: 0;
		}
	}

	@media (max-width: 419px) {
		.landing-hero {
			padding-inline-start: 1rem;
			padding-inline-end: 1rem;
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
