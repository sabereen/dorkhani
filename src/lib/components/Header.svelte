<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { navigating, page } from '$app/state'
	import { authClient } from '$lib/auth-client'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import LanguageSwitcher from './LanguageSwitcher.svelte'
	import type { Component, Snippet } from 'svelte'
	import IconAdd from '~icons/ic/round-add-circle-outline'
	import IconAccount from '~icons/ic/round-account-circle'
	import IconBack from '~icons/ic/round-arrow-forward-ios'
	import IconClose from '~icons/ic/round-close'
	import IconHistory from '~icons/ic/round-history'
	import IconHome from '~icons/ic/round-home'
	import IconList from '~icons/ic/round-format-list-bulleted'
	import IconLogin from '~icons/ic/round-login'
	import IconLogout from '~icons/ic/round-logout'
	import IconMenu from '~icons/ic/round-menu'
	import IconSettings from '~icons/ic/round-settings'

	type Props = {
		title?: string
		link?: string
		start?: Snippet
		end?: Snippet
	}

	type NavLink = {
		href: string
		label: string
		icon: Component
	}

	const { title, link, end, start }: Props = $props()
	const branding = $derived(
		page.data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, getLocale(), base),
	)
	const from = navigating.from
	let open = $state(false)
	let accountMenu: HTMLDetailsElement | undefined = $state()

	const links = $derived<NavLink[]>([
		{ href: localizeHref(`${base}/`), label: m.common_home(), icon: IconHome },
		{ href: localizeHref(`${base}/add`), label: m.nav_create(), icon: IconAdd },
		{ href: localizeHref(`${base}/list`), label: m.nav_khatms(), icon: IconList },
		{ href: localizeHref(`${base}/history`), label: m.nav_history(), icon: IconHistory },
		{ href: localizeHref(`${base}/settings`), label: m.nav_settings(), icon: IconSettings },
		page.data.user
			? { href: localizeHref(`${base}/account`), label: page.data.user.name || m.nav_account(), icon: IconAccount }
			: { href: localizeHref(`${base}/auth/login`), label: m.nav_login(), icon: IconLogin },
	])

	function isActive(href: string) {
		if (href === `${base}/`) return page.url.pathname === href
		return page.url.pathname.startsWith(href)
	}

	async function signOut() {
		await authClient.signOut()
		open = false
		accountMenu?.removeAttribute('open')
		await invalidateAll()
		await goto(localizeHref(`${base}/`))
	}

	function back() {
		if (from) {
			history.back()
		} else {
			goto(localizeHref(`${base}/`), { replaceState: true })
		}
	}

	function handleKeyboard(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false
			accountMenu?.removeAttribute('open')
		}
	}

	function handleDocumentClick(event: MouseEvent) {
		if (accountMenu && !accountMenu.contains(event.target as Node)) {
			accountMenu.removeAttribute('open')
		}
	}
</script>

<svelte:document onkeyup={handleKeyboard} onclick={handleDocumentClick} />

<header class="ui-header" class:ui-header-with-context={title}>
	<div class="ui-header-inner">
		<a
			class="ui-header-brand"
			class:ui-header-brand-desktop={title}
			href={localizeHref(`${base}/`)}
			aria-label={branding.name}
		>
			<span class="ui-header-brand-mark">
				<img src={branding.icon192Url} width="48" height="48" alt="" />
			</span>
			<span class="ui-header-brand-copy">
				<small>{branding.tagline}</small>
				<strong>{branding.name}</strong>
			</span>
		</a>

		<nav class="ui-nav ui-desktop-only" aria-label={m.language_selector_label()}>
			{#each links.slice(0, 4) as navLink}
				{@const NavIcon = navLink.icon}
				<a
					class="ui-nav-link"
					class:ui-nav-link-active={isActive(navLink.href)}
					href={navLink.href}
					aria-current={isActive(navLink.href) ? 'page' : undefined}
				>
					<NavIcon class="ui-nav-link-icon" />
					<span>{navLink.label}</span>
				</a>
			{/each}
		</nav>

		<div class="ui-header-global">
			{#if !title}
				<a class="ui-header-create ui-desktop-only" href={localizeHref(`${base}/add`)}>
					<span class="ui-header-create-icon"><IconAdd /></span>
					<span><strong>{m.nav_create()}</strong></span>
				</a>
			{/if}
			<LanguageSwitcher compact />

			{#if page.data.user}
				<details class="ui-header-account ui-desktop-only" bind:this={accountMenu}>
					<summary aria-label={m.nav_account()}>
						<IconAccount />
						<span>
							<small>{m.nav_account()}</small>
							<strong>{page.data.user.name || m.nav_account()}</strong>
						</span>
					</summary>
					<div class="ui-header-account-menu">
						<a href={localizeHref(`${base}/account`)}><IconAccount /><span>{m.nav_account()}</span></a>
						<a href={localizeHref(`${base}/settings`)}><IconSettings /><span>{m.nav_settings()}</span></a>
						<button type="button" onclick={signOut}>
							<IconLogout /><span>{m.nav_logout()}</span>
						</button>
					</div>
				</details>
			{:else}
				<a class="ui-header-utility ui-desktop-only" href={localizeHref(`${base}/settings`)} aria-label={m.nav_settings()}>
					<IconSettings />
				</a>
				<a class="ui-header-login ui-desktop-only" href={localizeHref(`${base}/auth/login`)}>
					<IconLogin /><span>{m.nav_login()}</span>
				</a>
			{/if}

			<button
				type="button"
				class="ui-header-menu-button ui-mobile-only"
				aria-label={open ? m.common_close() : m.common_more()}
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				{#if open}<IconClose />{:else}<IconMenu />{/if}
			</button>
		</div>

		{#if title}
			<div class="ui-header-context-bar">
				<div class="ui-header-context">
					{#if start}
						{@render start()}
					{:else}
						<button type="button" class="ui-header-back" aria-label={m.common_back()} onclick={back}>
							<IconBack />
						</button>
					{/if}

					<div class="ui-header-page-copy">
						<span>{m.common_view()}</span>
						<h1 class="ui-header-title select-none">
							{#if link}<a href={link}>{title}</a>{:else}{title}{/if}
						</h1>
					</div>
				</div>

				{#if end}
					<div class="ui-header-actions">
						{@render end()}
					</div>
				{/if}
			</div>
		{/if}

		{#if open}
			<nav class="ui-mobile-menu ui-mobile-only" aria-label={m.nav_khatms()}>
				<LanguageSwitcher />
				{#each links as navLink}
					{@const NavIcon = navLink.icon}
					<a
						class="ui-nav-link"
						class:ui-nav-link-active={isActive(navLink.href)}
						href={navLink.href}
						onclick={() => (open = false)}
						aria-current={isActive(navLink.href) ? 'page' : undefined}
					>
						<span class="ui-mobile-nav-icon"><NavIcon /></span>
						<span>{navLink.label}</span>
					</a>
				{/each}
				{#if page.data.user}
					<button class="ui-btn ui-btn-ghost ui-btn-block mt-1" type="button" onclick={signOut}>
						<span class="ui-mobile-nav-icon"><IconLogout /></span>
						<span>{m.nav_logout()}</span>
					</button>
				{/if}
			</nav>
		{/if}
	</div>
</header>
