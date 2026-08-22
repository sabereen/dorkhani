<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import * as m from '$lib/paraglide/messages.js'
	import type { Snippet } from 'svelte'
	import PageTitle from './PageTitle.svelte'

	type Props = {
		title: string
		eyebrow: string
		summary: string
		children: Snippet
	}

	const { title, eyebrow, summary, children }: Props = $props()
</script>

<PageTitle {title} />

<svelte:head>
	<meta name="description" content={summary} />
</svelte:head>

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
