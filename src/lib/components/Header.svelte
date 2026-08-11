<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { navigating, page } from '$app/state'
	import { authClient } from '$lib/auth-client'
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
	const from = navigating.from
	let open = $state(false)
	let accountMenu: HTMLDetailsElement | undefined = $state()

	const links = $derived<NavLink[]>([
		{ href: `${base}/`, label: 'خانه', icon: IconHome },
		{ href: `${base}/add`, label: 'ایجاد ختم', icon: IconAdd },
		{ href: `${base}/list`, label: 'فهرست عمومی', icon: IconList },
		{ href: `${base}/history`, label: 'تاریخچه', icon: IconHistory },
		{ href: `${base}/settings`, label: 'تنظیمات', icon: IconSettings },
		page.data.user
			? { href: `${base}/account`, label: page.data.user.name || 'حساب من', icon: IconAccount }
			: { href: `${base}/auth/login`, label: 'ورود', icon: IconLogin },
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
		await goto(`${base}/`)
	}

	function back() {
		if (from) {
			history.back()
		} else {
			goto(`${base}/`, { replaceState: true })
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

<header class="ui-header">
	<div class="ui-header-inner">
		<a
			class="ui-header-brand"
			class:ui-header-brand-desktop={title}
			href={`${base}/`}
			aria-label="سامانه ختم جمعی قرآن"
		>
			<span class="ui-header-brand-mark">
				<img src={`${base}/hero.png`} width="48" height="48" alt="" />
			</span>
			<span class="ui-header-brand-copy">
				<small>سامانه همراهی قرآنی</small>
				<strong>ختم جمعی قرآن</strong>
			</span>
		</a>

		<nav class="ui-nav ui-desktop-only" aria-label="ناوبری اصلی">
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

		<div class="ui-header-tools">
			{#if title}
				<div class="ui-header-context">
					{#if start}
						{@render start()}
					{:else}
						<button type="button" class="ui-header-back" aria-label="بازگشت" onclick={back}>
							<IconBack />
						</button>
					{/if}

					<div class="ui-header-page-copy">
						<span>صفحه جاری</span>
						<h1 class="ui-header-title select-none">
							{#if link}<a href={link}>{title}</a>{:else}{title}{/if}
						</h1>
					</div>
				</div>
			{:else}
				<a class="ui-header-create ui-desktop-only" href={`${base}/add`}>
					<span class="ui-header-create-icon"><IconAdd /></span>
					<span><small>یک همراهی تازه</small><strong>ایجاد ختم جدید</strong></span>
				</a>
			{/if}

			<div class="ui-header-actions">
				{#if end}
					{@render end()}
				{/if}

				{#if page.data.user}
					<details class="ui-header-account ui-desktop-only" bind:this={accountMenu}>
						<summary aria-label="باز کردن منوی حساب کاربری">
							<IconAccount />
							<span>
								<small>حساب کاربری</small>
								<strong>{page.data.user.name || 'حساب من'}</strong>
							</span>
						</summary>
						<div class="ui-header-account-menu">
							<a href={`${base}/account`}><IconAccount /><span>حساب من</span></a>
							<a href={`${base}/settings`}><IconSettings /><span>تنظیمات</span></a>
							<button type="button" onclick={signOut}>
								<IconLogout /><span>خروج</span>
							</button>
						</div>
					</details>
				{:else}
					<a
						class="ui-header-utility ui-desktop-only"
						href={`${base}/settings`}
						aria-label="تنظیمات"
					>
						<IconSettings />
					</a>
					<a class="ui-header-login ui-desktop-only" href={`${base}/auth/login`}>
						<IconLogin /><span>ورود</span>
					</a>
				{/if}

				<button
					type="button"
					class="ui-header-menu-button ui-mobile-only"
					aria-label={open ? 'بستن منو' : 'باز کردن منو'}
					aria-expanded={open}
					onclick={() => (open = !open)}
				>
					{#if open}<IconClose />{:else}<IconMenu />{/if}
				</button>
			</div>
		</div>

		{#if open}
			<nav class="ui-mobile-menu ui-mobile-only" aria-label="ناوبری موبایل">
				<span class="ui-mobile-menu-label">مسیرهای اصلی</span>
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
						<span>خروج</span>
					</button>
				{/if}
			</nav>
		{/if}
	</div>
</header>
