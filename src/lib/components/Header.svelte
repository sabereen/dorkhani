<script lang="ts">
	import { afterNavigate, goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { navigating, page } from '$app/state'
	import { authClient, clearAuthToken } from '$lib/auth-client'
	import { DEFAULT_BRANDING_CONFIG, getPublicBranding } from '$lib/entity/Branding'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import { isInstalledApp } from '$lib/config/installedApp'
	import Modal from './Modal.svelte'
	import LanguageModal from './LanguageModal.svelte'
	import { localeLabel } from '$lib/i18n/client'
	import IconLanguage from '~icons/ic/round-language'
	import { onMount, tick, type Component, type Snippet } from 'svelte'
	import IconAdd from '~icons/ic/round-add-circle-outline'
	import IconAccount from '~icons/ic/round-account-circle'
	import IconBack from '~icons/ic/round-arrow-forward-ios'
	import IconClose from '~icons/ic/round-close'
	import IconHistory from '~icons/ic/round-history'
	import IconHome from '~icons/ic/round-home'
	import IconOffline from '~icons/ic/round-cloud-off'
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
		secondaryActions?: Snippet<[() => Promise<void>]>
	}

	type NavLink = {
		href: string
		label: string
		icon: Component
	}

	const { title, link, end, start, secondaryActions }: Props = $props()
	const branding = $derived(
		page.data.branding ?? getPublicBranding(DEFAULT_BRANDING_CONFIG, getLocale(), base),
	)
	const from = navigating.from
	let open = $state(false)
	const menuId = $props.id()
	let menuButton: HTMLButtonElement | undefined = $state()
	let languageOpen = $state(false)
	let desktop = $state(false)
	let headerElement: HTMLElement | undefined = $state()
	let offlineKhatmAvailable = $state(false)

	onMount(() => {
		offlineKhatmAvailable = isInstalledApp()
		const media = window.matchMedia('(min-width: 1100px)')
		const syncDesktop = () => {
			desktop = media.matches && (headerElement?.clientWidth ?? 0) >= 800
		}
		syncDesktop()
		media.addListener(syncDesktop)
		window.addEventListener('resize', syncDesktop)
		const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncDesktop) : null
		if (headerElement) observer?.observe(headerElement)
		return () => {
			media.removeListener(syncDesktop)
			window.removeEventListener('resize', syncDesktop)
			observer?.disconnect()
		}
	})

	afterNavigate(() => {
		open = false
	})

	const links = $derived<NavLink[]>([
		{ href: localizeHref(`${base}/`), label: m.common_home(), icon: IconHome },
		{ href: localizeHref(`${base}/add`), label: m.nav_create(), icon: IconAdd },
		...(offlineKhatmAvailable
			? [
					{
						href: localizeHref(`${base}/offline-khatm`),
						label: m.nav_offline_khatm(),
						icon: IconOffline,
					},
				]
			: []),
		{ href: localizeHref(`${base}/list`), label: m.nav_khatms(), icon: IconList },
		{ href: localizeHref(`${base}/history`), label: m.nav_history(), icon: IconHistory },
		{ href: localizeHref(`${base}/settings`), label: m.nav_settings(), icon: IconSettings },
		page.data.user
			? {
					href: localizeHref(`${base}/account`),
					label: page.data.user.name || m.nav_account(),
					icon: IconAccount,
				}
			: { href: localizeHref(`${base}/auth/login`), label: m.nav_login(), icon: IconLogin },
	])

	function isActive(href: string) {
		const pathname = page.url.pathname.replace(/\/$/, '')
		const target = href.replace(/\/$/, '')
		if (href === localizeHref(`${base}/`)) return pathname === target
		return pathname === target || pathname.startsWith(`${target}/`)
	}

	async function signOut() {
		await authClient.signOut().catch(() => undefined)
		await clearAuthToken()
		open = false
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

	async function closeMenu() {
		if (!open) return
		open = false
		await tick()
	}

	async function openLanguage() {
		await closeMenu()
		languageOpen = true
	}
</script>

<header class="ui-header" class:ui-header-wide={desktop} bind:this={headerElement}>
	<div class="ui-header-inner">
		{#if title}
			<div class="ui-header-context">
				{#if start}
					{@render start()}
				{:else}
					<button
						type="button"
						class="ui-header-back"
						aria-label={m.common_back()}
						title={m.common_back()}
						onclick={back}
					>
						<IconBack />
					</button>
				{/if}
				<h1 class="ui-header-title" {title}>
					{#if link}<a href={link}>{title}</a>{:else}{title}{/if}
				</h1>
			</div>
		{:else}
			<a class="ui-header-brand" href={localizeHref(`${base}/`)} aria-label={branding.name}>
				<span class="ui-header-brand-mark">
					<img src={branding.icon192Url} width="36" height="36" alt="" />
				</span>
				<strong>{branding.name}</strong>
			</a>
		{/if}

		<div class="ui-header-controls">
			{#if desktop && secondaryActions}
				<div class="ui-header-actions">
					{@render secondaryActions(closeMenu)}
				</div>
			{/if}
			{#if end}
				<div class="ui-header-actions">
					{@render end()}
				</div>
			{:else if !title}
				<a
					class="ui-header-page-action ui-header-page-action-primary"
					href={localizeHref(`${base}/add`)}
					aria-label={m.nav_create()}
					title={m.nav_create()}
				>
					<IconAdd /><span>{m.nav_create()}</span>
				</a>
			{/if}
			<button
				type="button"
				class="ui-header-menu-button"
				aria-label={open ? m.common_close() : m.common_more()}
				title={open ? m.common_close() : m.common_more()}
				aria-expanded={open}
				aria-haspopup="dialog"
				bind:this={menuButton}
				onclick={() => {
					menuButton?.focus()
					open = true
				}}
			>
				{#if open}<IconClose />{:else}<IconMenu />{/if}
			</button>
		</div>
	</div>

</header>

<Modal bind:open contentClass="ui-header-menu-modal" labelledBy={menuId}>
	<div class="ui-header-menu-heading">
		<span class="ui-header-menu-brand" aria-hidden="true">
			<img src={branding.icon192Url} width="48" height="48" alt="" />
		</span>
		<div class="ui-header-menu-copy">
			<h2 id={menuId}>{branding.name}</h2>
			<p>{branding.tagline}</p>
		</div>
		<button
			type="button"
			class="ui-btn ui-btn-ghost ui-btn-icon ui-header-menu-close"
			aria-label={m.common_close()}
			onclick={closeMenu}
		>
			<IconClose />
		</button>
	</div>

	{#if !desktop && secondaryActions}
		<section class="ui-header-menu-context" aria-labelledby={`${menuId}-context`}>
			<h3 id={`${menuId}-context`}>{title}</h3>
			<div class="ui-header-menu-actions">
				{@render secondaryActions(closeMenu)}
			</div>
		</section>
	{/if}

	<nav class="ui-header-menu-grid" aria-label={branding.name}>
		{#each links.slice(0, -2) as navLink}
			{@const NavIcon = navLink.icon}
			<a
				class="ui-header-menu-tile"
				class:ui-header-menu-tile-active={isActive(navLink.href)}
				href={navLink.href}
				onclick={closeMenu}
				aria-current={isActive(navLink.href) ? 'page' : undefined}
			>
				<span class="ui-header-menu-icon" aria-hidden="true"><NavIcon /></span>
				<span>{navLink.label}</span>
			</a>
		{/each}
	</nav>

	<div class="ui-header-menu-footer">
		{@const accountLink = links[links.length - 1]}
		<a class="ui-header-menu-account" href={accountLink.href} onclick={closeMenu}>
			<span class="ui-header-menu-icon" aria-hidden="true">
				{#if page.data.user}<IconAccount />{:else}<IconLogin />{/if}
			</span>
			<span>
				{#if page.data.user}<small>{m.nav_account()}</small>{/if}
				<strong>{accountLink.label}</strong>
			</span>
		</a>
		<div class="ui-header-menu-preferences">
			<a class="ui-nav-link" href={localizeHref(`${base}/settings`)} onclick={closeMenu}>
				<IconSettings /><span>{m.nav_settings()}</span>
			</a>
			{#if !page.url.pathname.startsWith('/admin')}
				<button class="ui-nav-link" type="button" onclick={openLanguage}>
					<IconLanguage /><span>{m.language_selector_label()}: {localeLabel(getLocale())}</span>
				</button>
			{/if}
			{#if page.data.user}
				<button class="ui-nav-link" type="button" onclick={signOut}>
					<IconLogout /><span>{m.nav_logout()}</span>
				</button>
			{/if}
		</div>
	</div>
</Modal>

<LanguageModal bind:open={languageOpen} />
