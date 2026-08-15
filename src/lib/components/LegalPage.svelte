<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import type { Snippet } from 'svelte'

	type Props = {
		title: string
		eyebrow: string
		summary: string
		children: Snippet
	}

	const { title, eyebrow, summary, children }: Props = $props()
</script>

<svelte:head>
	<title>{title} | ختم قرآن</title>
	<meta name="description" content={summary} />
</svelte:head>

<Header {title} />

<article class="ui-legal-page">
	<header class="ui-legal-hero">
		<span class="ui-badge ui-badge-accent">{eyebrow}</span>
		<h2>{title}</h2>
		<p>{summary}</p>
		<p class="ui-legal-updated">آخرین به‌روزرسانی: ۲۴ مرداد ۱۴۰۵</p>
	</header>

	<div class="ui-legal-content">
		{@render children()}
	</div>
</article>
