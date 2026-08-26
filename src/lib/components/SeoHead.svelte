<script lang="ts">
	import type { SeoMeta } from '$lib/seo/metadata'
	import {
		absolutePublicUrl,
		localeCode,
		localizedCanonicalPaths,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_WIDTH,
		serializeJsonLd,
	} from '$lib/seo/metadata'
	import { page } from '$app/state'

	type Props = { meta: SeoMeta }

	let { meta }: Props = $props()

	const canonical = $derived(absolutePublicUrl(meta.canonicalPath, page.url.origin))
	const image = $derived(absolutePublicUrl(meta.imagePath, page.url.origin))
	const alternatePaths = $derived(localizedCanonicalPaths(meta.canonicalPath))
	const jsonLd = $derived(meta.jsonLd ? serializeJsonLd(meta.jsonLd) : null)
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="fa" href={absolutePublicUrl(alternatePaths.fa, page.url.origin)} />
	<link rel="alternate" hreflang="ar" href={absolutePublicUrl(alternatePaths.ar, page.url.origin)} />
	<link rel="alternate" hreflang="en" href={absolutePublicUrl(alternatePaths.en, page.url.origin)} />
	<link rel="alternate" hreflang="x-default" href={absolutePublicUrl(alternatePaths.fa, page.url.origin)} />
	{#if meta.robots}<meta name="robots" content={meta.robots} />{/if}
	<meta property="og:type" content={meta.type || 'website'} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={localeCode(meta.locale)} />
	<meta property="og:image" content={image} />
	<meta property="og:image:secure_url" content={image} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
	<meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
	<meta property="og:image:alt" content={meta.imageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={meta.imageAlt} />
	{#if jsonLd}<script type="application/ld+json">{jsonLd}</script>{/if}
</svelte:head>
