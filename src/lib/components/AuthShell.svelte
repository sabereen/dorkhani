<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import type { Snippet } from 'svelte'
	import Header from '$lib/components/Header.svelte'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import IconAutoAwesome from '~icons/ic/round-auto-awesome'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconGroups from '~icons/ic/round-groups'
	import IconMenuBook from '~icons/ic/round-menu-book'

	type Props = {
		title: string
		eyebrow: string
		description: string
		children: Snippet
	}

	const { title, eyebrow, description, children }: Props = $props()
	const branding = $derived(
		page.data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, getLocale(), base),
	)
</script>

<Header {title} />

<section class="ui-auth-shell">
	<span class="ui-auth-orb ui-auth-orb-one" aria-hidden="true"></span>
	<span class="ui-auth-orb ui-auth-orb-two" aria-hidden="true"></span>

	<aside class="ui-auth-story" aria-label={m.auth_story_about({ name: branding.name })}>
		<a class="ui-auth-brand" href={localizeHref(`${base}/`)}>
			<span class="ui-auth-brand-mark">
				<img src={branding.icon192Url} width="54" height="54" alt="" />
			</span>
			<span>
				<strong>{branding.name}</strong>
				<small>{branding.tagline}</small>
			</span>
		</a>

		<div class="ui-auth-story-copy">
			<span class="ui-auth-kicker"><IconAutoAwesome /> {m.auth_story_kicker()}</span>
			<h2>{m.auth_story_title()}</h2>
			<p>{m.auth_story_description()}</p>
		</div>

		<ul class="ui-auth-benefits">
			<li><IconMenuBook /><span>{m.auth_story_share_access()}</span></li>
			<li><IconGroups /><span>{m.auth_story_manage()}</span></li>
			<li><IconCheck /><span>{m.auth_story_secure()}</span></li>
		</ul>
	</aside>

	<div class="ui-auth-panel">
		<div class="ui-auth-panel-heading">
			<span class="ui-auth-heading-icon"><IconAutoAwesome /></span>
			<div>
				<span>{eyebrow}</span>
				<h2>{title}</h2>
				<p>{description}</p>
			</div>
		</div>

		{@render children()}
	</div>
</section>
