<script lang="ts">
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import Header from '$lib/components/Header.svelte'

	import IconArrow from '~icons/ic/round-arrow-back'
	import IconExplore from '~icons/ic/round-explore'
	import IconHome from '~icons/ic/round-home'
	import IconMenuBook from '~icons/ic/round-menu-book'
	import IconRefresh from '~icons/ic/round-refresh'

	const isNotFound = $derived(page.status === 404)
	const title = $derived(isNotFound ? 'این صفحه پیدا نشد' : 'مشکلی پیش آمده است')
	const description = $derived(
		isNotFound
			? 'ممکن است نشانی صفحه تغییر کرده باشد یا این مسیر دیگر در دسترس نباشد.'
			: page.error?.message || 'در نمایش این صفحه خطایی رخ داده است. لطفاً دوباره تلاش کنید.',
	)

	function retry() {
		window.location.reload()
	}

	function goBack() {
		if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
			history.back()
		} else {
			void goto(`${base}/`)
		}
	}
</script>

<svelte:head>
	<title>{page.status} | {title}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header title={isNotFound ? 'صفحه پیدا نشد' : 'خطای سامانه'} />

<section class="error-page" aria-labelledby="error-title">
	<div class="error-orb error-orb-one" aria-hidden="true"></div>
	<div class="error-orb error-orb-two" aria-hidden="true"></div>

	<div class="error-copy">
		<div class="error-status" aria-label={`کد خطا ${page.status}`}>
			<span aria-hidden="true"></span>
			خطای {page.status.toLocaleString('fa')}
		</div>

		<p class="error-eyebrow">گاهی مسیرها کمی دورتر از انتظارند</p>
		<h1 id="error-title">{title}</h1>
		<p class="error-description">{description}</p>

		<div class="error-actions">
			<a class="ui-btn ui-btn-primary ui-btn-lg" href={`${base}/`}>
				<IconHome />
				بازگشت به خانه
			</a>
			{#if isNotFound}
				<button class="ui-btn ui-btn-outline ui-btn-lg" type="button" onclick={goBack}>
					<IconArrow />
					صفحهٔ قبلی
				</button>
			{:else}
				<button class="ui-btn ui-btn-outline ui-btn-lg" type="button" onclick={retry}>
					<IconRefresh />
					تلاش دوباره
				</button>
			{/if}
		</div>

		<a class="error-help-link" href={`${base}/list`}>
			<IconExplore />
			<span>یا ختم‌های عمومی را ببینید</span>
		</a>
	</div>

	<div class="error-visual" aria-hidden="true">
		<div class="error-code error-code-back">{page.status}</div>
		<div class="error-illustration">
			<div class="error-halo error-halo-large"></div>
			<div class="error-halo error-halo-small"></div>
			<div class="error-book">
				<div class="error-book-page error-book-page-right">
					<span></span><span></span><span></span>
				</div>
				<div class="error-book-spine"><IconMenuBook /></div>
				<div class="error-book-page error-book-page-left">
					<span></span><span></span><span></span>
				</div>
			</div>
			<div class="error-spark error-spark-one">✦</div>
			<div class="error-spark error-spark-two">✦</div>
			<div class="error-spark error-spark-three">·</div>
		</div>
		<p>راه خانه همیشه روشن است</p>
	</div>
</section>

<style>
	.error-page {
		position: relative;
		display: grid;
		min-height: 34rem;
		grid-template-columns: minmax(0, 1fr);
		grid-gap: 2rem;
		align-items: center;
		margin-top: 1.25rem;
		padding: 2rem 1.25rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 2rem;
		background: linear-gradient(145deg, var(--ui-color-surface), var(--ui-color-primary-soft));
		box-shadow: var(--ui-shadow-lg);
		overflow: hidden;
	}

	.error-orb {
		position: absolute;
		display: block;
		border-radius: 9999px;
		background: var(--ui-color-info-soft);
		opacity: 0.7;
		pointer-events: none;
	}

	.error-orb-one {
		top: -6rem;
		right: -5rem;
		width: 15rem;
		height: 15rem;
	}

	.error-orb-two {
		bottom: -8rem;
		left: 18%;
		width: 18rem;
		height: 18rem;
		background: var(--ui-color-success-soft);
		opacity: 0.55;
	}

	.error-copy,
	.error-visual {
		position: relative;
		z-index: 1;
	}

	.error-copy {
		max-width: 34rem;
	}

	.error-status {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: 9999px;
		background: var(--ui-color-surface);
		color: var(--ui-color-primary);
		font-size: 0.72rem;
		font-weight: 900;
		box-shadow: var(--ui-shadow-sm);
	}

	.error-status span {
		display: block;
		width: 0.5rem;
		height: 0.5rem;
		margin-left: 0.45rem;
		border-radius: 9999px;
		background: var(--ui-color-warning);
		box-shadow: 0 0 0 0.22rem var(--ui-color-warning-soft);
	}

	.error-eyebrow {
		margin: 1.4rem 0 0;
		color: var(--ui-color-primary);
		font-size: 0.78rem;
		font-weight: 900;
	}

	.error-copy h1 {
		margin: 0.4rem 0 0;
		font-size: 2.25rem;
		font-weight: 950;
		line-height: 1.45;
		letter-spacing: -0.025em;
	}

	.error-description {
		max-width: 31rem;
		margin: 0.85rem 0 0;
		color: var(--ui-color-text-muted);
		font-size: 0.92rem;
		line-height: 2;
	}

	.error-actions {
		display: flex;
		flex-wrap: wrap;
		margin-top: 1.75rem;
	}

	.error-actions > * {
		margin-top: 0.4rem;
		margin-bottom: 0.4rem;
	}

	.error-actions > * + * {
		margin-right: 0.65rem;
	}

	.error-actions :global(svg),
	.error-help-link :global(svg) {
		width: 1.2rem;
		height: 1.2rem;
	}

	.error-help-link {
		display: inline-flex;
		align-items: center;
		margin-top: 0.85rem;
		color: var(--ui-color-text-muted);
		font-size: 0.75rem;
		font-weight: 800;
		text-decoration: none;
	}

	.error-help-link > :global(*) + :global(*) {
		margin-right: 0.4rem;
	}

	.error-help-link:hover {
		color: var(--ui-color-primary);
		text-decoration: underline;
	}

	.error-visual {
		display: flex;
		min-height: 20rem;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.error-code {
		font-weight: 950;
		line-height: 1;
		user-select: none;
	}

	.error-code-back {
		position: absolute;
		top: 50%;
		left: 50%;
		color: var(--ui-color-border-strong);
		font-size: 10rem;
		opacity: 0.24;
		transform: translate(-50%, -55%);
	}

	.error-illustration {
		position: relative;
		display: flex;
		width: 17rem;
		height: 17rem;
		align-items: center;
		justify-content: center;
	}

	.error-halo {
		position: absolute;
		border: 1px solid var(--ui-color-border-strong);
		border-radius: 9999px;
	}

	.error-halo-large {
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		opacity: 0.35;
	}

	.error-halo-small {
		top: 2rem;
		right: 2rem;
		bottom: 2rem;
		left: 2rem;
		border-style: dashed;
		opacity: 0.6;
	}

	.error-book {
		position: relative;
		display: grid;
		width: 13rem;
		height: 8rem;
		grid-template-columns: minmax(0, 1fr) 1.8rem minmax(0, 1fr);
		filter: drop-shadow(0 1rem 1rem var(--ui-color-focus));
		transform: perspective(24rem) rotateX(9deg);
	}

	.error-book-page {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 1rem;
		border: 1px solid var(--ui-color-border-strong);
		background: var(--ui-color-surface);
	}

	.error-book-page-right {
		border-radius: 0.5rem 1.2rem 1.2rem 0.5rem;
		transform: skewY(4deg);
	}

	.error-book-page-left {
		border-radius: 1.2rem 0.5rem 0.5rem 1.2rem;
		transform: skewY(-4deg);
	}

	.error-book-page span {
		display: block;
		height: 0.22rem;
		border-radius: 9999px;
		background: var(--ui-color-border);
	}

	.error-book-page span + span {
		margin-top: 0.65rem;
	}

	.error-book-page span:nth-child(2) {
		width: 78%;
	}

	.error-book-spine {
		display: flex;
		align-items: center;
		justify-content: center;
		border-top: 1px solid var(--ui-color-border-strong);
		border-bottom: 1px solid var(--ui-color-border-strong);
		background: var(--ui-color-primary);
		color: var(--ui-color-on-primary);
	}

	.error-book-spine :global(svg) {
		width: 1.15rem;
		height: 1.15rem;
	}

	.error-spark {
		position: absolute;
		color: var(--ui-color-warning);
		font-weight: 950;
	}

	.error-spark-one {
		top: 1.5rem;
		right: 2.6rem;
		font-size: 1.45rem;
	}

	.error-spark-two {
		bottom: 2.4rem;
		left: 2rem;
		font-size: 1rem;
	}

	.error-spark-three {
		top: 3rem;
		left: 1.7rem;
		font-size: 2.5rem;
	}

	.error-visual > p {
		margin: -0.25rem 0 0;
		color: var(--ui-color-text-muted);
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.02em;
	}

	@media (min-width: 768px) {
		.error-page {
			grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr);
			padding: 3rem;
		}

		.error-copy h1 {
			font-size: 2.85rem;
		}
	}

	@media (min-width: 1100px) {
		.error-page {
			min-height: 38rem;
			padding: 4.25rem;
		}

		.error-illustration {
			width: 20rem;
			height: 20rem;
		}

		.error-code-back {
			font-size: 12.5rem;
		}
	}

	@media (max-width: 479px) {
		.error-page {
			min-height: 0;
			padding: 1.5rem 1rem;
			border-radius: 1.4rem;
		}

		.error-copy {
			text-align: center;
		}

		.error-copy h1 {
			font-size: 1.8rem;
		}

		.error-actions {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			grid-gap: 0.6rem;
		}

		.error-actions > *,
		.error-actions > * + * {
			width: 100%;
			margin: 0;
		}

		.error-help-link {
			justify-content: center;
		}

		.error-visual {
			min-height: 15rem;
		}

		.error-illustration {
			width: 14rem;
			height: 14rem;
		}

		.error-book {
			width: 11rem;
			height: 6.75rem;
		}

		.error-code-back {
			font-size: 8rem;
		}
	}
</style>
