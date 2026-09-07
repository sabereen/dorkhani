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
	import LanguageSwitcher from './LanguageSwitcher.svelte'
	import { onMount, type Component, type Snippet } from 'svelte'
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
		secondaryActions?: Snippet<[() => void]>
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
	let menuPanel: HTMLElement | undefined = $state()
	let desktop = $state(false)
	let headerElement: HTMLElement | undefined = $state()
	let offlineKhatmAvailable = $state(false)

	onMount(() => {
		offlineKhatmAvailable = isInstalledApp()
		const media = window.matchMedia('(min-width: 1100px)')
		const syncDesktop = () => {
			closeMenu()
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

	function closeMenu() {
		if (!open) return
		open = false
		menuButton?.focus()
	}

	function handleKeyboard(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault()
			closeMenu()
		}
	}

	function handleDocumentInteraction(event: MouseEvent | FocusEvent) {
		const target = event.target as Node
		if (open && !menuPanel?.contains(target) && !menuButton?.contains(target)) {
			open = false
		}
	}
</script>

<svelte:document
	onkeydown={handleKeyboard}
	onclick={handleDocumentInteraction}
	onfocusin={handleDocumentInteraction}
/>

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
				aria-controls={menuId}
				bind:this={menuButton}
				onclick={() => (open = !open)}
			>
				{#if open}<IconClose />{:else}<IconMenu />{/if}
			</button>
		</div>
	</div>

	<div id={menuId} class="ui-header-menu" hidden={!open} bind:this={menuPanel}>
		{#if !desktop && secondaryActions}
			<div class="ui-header-menu-actions">
				{@render secondaryActions(closeMenu)}
			</div>
		{/if}
		<nav aria-label={branding.name}>
			{#each links as navLink}
				{@const NavIcon = navLink.icon}
				<a
					class="ui-nav-link"
					class:ui-nav-link-active={isActive(navLink.href)}
					href={navLink.href}
					onclick={closeMenu}
					aria-current={isActive(navLink.href) ? 'page' : undefined}
				>
					<NavIcon /><span>{navLink.label}</span>
				</a>
			{/each}
		</nav>
		<div class="ui-header-menu-preferences">
			<LanguageSwitcher menuItem onopen={closeMenu} />
			{#if page.data.user}
				<button class="ui-nav-link" type="button" onclick={signOut}>
					<IconLogout /><span>{m.nav_logout()}</span>
				</button>
			{/if}
		</div>
	</div>
</header>
