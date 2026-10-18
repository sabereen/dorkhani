<script lang="ts">
	import { localeTag } from '$lib/i18n/format'
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import Header from '$lib/components/Header.svelte'
	import { DEFAULT_BRANDING_CONFIG, getBrandingText } from '$lib/entity/Branding'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'

	import IconArrow from '~icons/ic/round-arrow-back'
	import IconExplore from '~icons/ic/round-explore'
	import IconHome from '~icons/ic/round-home'
	import IconMenuBook from '~icons/ic/round-menu-book'
	import IconRefresh from '~icons/ic/round-refresh'

	const isNotFound = $derived(page.status === 404)

	const title = $derived(isNotFound ? m.error_not_found_title() : m.error_system_title())

	const description = $derived(
		isNotFound
			? m.error_not_found_description()
			: page.error?.message || m.error_generic_description(),
	)

	const technicalMessage = $derived(page.error?.message || description)

	const technicalType = $derived(page.error?.name || 'UnknownError')

	const technicalStack = $derived(page.error?.stack || '')

	const technicalCause = $derived(page.error?.cause ?? null)

	const technicalPath = $derived(page.error?.path || page.url.pathname)

	const currentUrl = $derived(page.url?.href || '')

	const hasStack = $derived(Boolean(technicalStack))

	const hasCause = $derived(technicalCause !== null && technicalCause !== undefined)

	const errorDump = $derived(
		JSON.stringify(
			{
				status: page.status,
				name: technicalType,
				message: technicalMessage,
				path: technicalPath,
				url: currentUrl,
				stack: technicalStack || null,
				cause: technicalCause,
			},
			null,
			2,
		),
	)

	let copied = $state(false)

	function retry() {
		window.location.reload()
	}

	function goBack() {
		if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
			history.back()
		} else {
			void goto(localizeHref(`${base}/`))
		}
	}

	async function copyError() {
		try {
			await navigator.clipboard.writeText(errorDump)
			copied = true

			window.setTimeout(() => {
				copied = false
			}, 2000)
		} catch {
			copied = false
		}
	}
</script>

<svelte:head>
	<title
		>{page.status} | {technicalType}: {technicalMessage} | {page.data.branding?.name ||
			getBrandingText(DEFAULT_BRANDING_CONFIG, getLocale()).name}</title
	>
	<meta name="robots" content="noindex" />
</svelte:head>

<Header title={isNotFound ? m.error_not_found_title() : m.error_system_title()} />

<section class="ui-error-page" aria-labelledby="error-title">
	<div class="ui-error-orb ui-error-orb-one" aria-hidden="true"></div>
	<div class="ui-error-orb ui-error-orb-two" aria-hidden="true"></div>

	<div class="ui-error-copy">
		<div
			class="ui-error-status"
			aria-label={m.error_code({ status: page.status.toLocaleString(localeTag()) })}
		>
			<span aria-hidden="true"></span>
			{m.error_code({ status: page.status.toLocaleString(localeTag()) })}
		</div>

		<p class="ui-error-eyebrow">{m.error_eyebrow()}</p>
		<h1 id="error-title">{title}</h1>
		<p class="ui-error-description">{description}</p>

		<div class="ui-error-actions">
			<a class="ui-btn ui-btn-primary ui-btn-lg" href={localizeHref(`${base}/`)}>
				<IconHome />
				{m.common_home()}
			</a>
			{#if isNotFound}
				<button class="ui-btn ui-btn-outline ui-btn-lg" type="button" onclick={goBack}>
					<IconArrow class="ltr:mirror" />
					{m.common_back()}
				</button>
			{:else}
				<button class="ui-btn ui-btn-outline ui-btn-lg" type="button" onclick={retry}>
					<IconRefresh />
					{m.common_retry()}
				</button>
			{/if}
		</div>

		<a class="ui-error-help-link" href={localizeHref(`${base}/list`)}>
			<IconExplore />
			<span>{m.error_view_public()}</span>
		</a>
		<details class="ui-error-technical-details" open={!isNotFound}>
			<summary>{m.error_technical_details()}</summary>

			<div class="ui-technical-toolbar">
				<button class="ui-technical-copy-button" type="button" onclick={copyError}>
					{copied ? m.error_copied() : m.error_copy()}
				</button>
			</div>

			<div class="ui-technical-grid">
				<div class="ui-technical-row">
					<span class="ui-technical-label">{m.error_code({ status: '' })}</span>
					<code class="ui-technical-value">{page.status}</code>
				</div>

				<div class="ui-technical-row">
					<span class="ui-technical-label">{m.error_type()}</span>
					<code class="ui-technical-value">{technicalType}</code>
				</div>

				<div class="ui-technical-row">
					<span class="ui-technical-label">{m.error_path()}</span>
					<code class="ui-technical-value" dir="ltr">
						{technicalPath}
					</code>
				</div>

				<div class="ui-technical-row ui-technical-row-block">
					<span class="ui-technical-label">{m.error_message()}</span>
					<pre class="ui-technical-pre" dir="ltr">{technicalMessage}</pre>
				</div>

				{#if hasStack}
					<div class="ui-technical-row ui-technical-row-block">
						<span class="ui-technical-label">{m.error_stack()}</span>

						<pre class="ui-technical-pre ui-technical-stack" dir="ltr">{technicalStack}</pre>
					</div>
				{/if}

				{#if hasCause}
					<div class="ui-technical-row ui-technical-row-block">
						<span class="ui-technical-label">{m.error_cause()}</span>

						<pre class="ui-technical-pre ui-technical-stack" dir="ltr">{JSON.stringify(
								technicalCause,
								null,
								2,
							)}</pre>
					</div>
				{/if}

				<div class="ui-technical-row ui-technical-row-block">
					<span class="ui-technical-label">{m.error_url()}</span>
					<pre class="ui-technical-pre" dir="ltr">{currentUrl}</pre>
				</div>
			</div>

			<details class="ui-technical-raw">
				<summary>{m.error_raw()}</summary>

				<pre class="ui-technical-pre ui-technical-stack" dir="ltr">{errorDump}</pre>
			</details>
		</details>
	</div>

	<div class="ui-error-visual" aria-hidden="true">
		<div class="ui-error-code ui-error-code-back">{page.status}</div>
		<div class="ui-error-illustration">
			<div class="ui-error-halo ui-error-halo-large"></div>
			<div class="ui-error-halo ui-error-halo-small"></div>
			<div class="ui-error-book">
				<div class="ui-error-book-page ui-error-book-page-right">
					<span></span><span></span><span></span>
				</div>
				<div class="ui-error-book-spine"><IconMenuBook /></div>
				<div class="ui-error-book-page ui-error-book-page-left">
					<span></span><span></span><span></span>
				</div>
			</div>
			<div class="ui-error-spark ui-error-spark-one">✦</div>
			<div class="ui-error-spark ui-error-spark-two">✦</div>
			<div class="ui-error-spark ui-error-spark-three">·</div>
		</div>
		<p>{m.error_home_light()}</p>
	</div>
</section>
