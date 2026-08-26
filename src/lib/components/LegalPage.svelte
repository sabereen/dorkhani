<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import * as m from '$lib/paraglide/messages.js'
	import type { Snippet } from 'svelte'
	import PageTitle from './PageTitle.svelte'
	import SeoHead from './SeoHead.svelte'
	import { page } from '$app/state'

	type Props = {
		title: string
		eyebrow: string
		summary: string
		children: Snippet
	}

	const { title, eyebrow, summary, children }: Props = $props()
</script>

	<PageTitle {title} emitHead={false} />

<SeoHead
	meta={{
		title: `${title} | ${page.data.branding.name}`,
		description: summary,
		canonicalPath: page.url.pathname,
		imagePath: `/og/home.png?v=${encodeURIComponent(page.data.branding.revision)}`,
		imageAlt: page.data.branding.name,
		locale: page.data.locale,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: title,
			description: summary,
			url: page.url.href,
			inLanguage: page.data.locale,
		},
	}}
/>

<Header {title} />

<article class="ui-legal-page">
	<header class="ui-legal-hero">
		<span class="ui-badge ui-badge-accent">{eyebrow}</span>
		<h2>{title}</h2>
		<p>{summary}</p>
		<p class="ui-legal-updated">{m.legal_last_updated()}</p>
	</header>

	<div class="ui-legal-content">
		{@render children()}
	</div>
</article>
