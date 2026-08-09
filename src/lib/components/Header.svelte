<script lang="ts">
	import { base } from '$app/paths'
	import { navigating, page } from '$app/state'
	import type { Snippet } from 'svelte'
	import IconBack from '~icons/ic/round-arrow-forward-ios'
	import IconMenu from '~icons/ic/round-menu'
	import IconClose from '~icons/ic/round-close'
	import { goto } from '$app/navigation'

	type Props = {
		title?: string
		link?: string
		start?: Snippet
		end?: Snippet
	}

	const { title, link, end, start }: Props = $props()

	const from = navigating.from
	let open = $state(false)

	const links = [
		{ href: `${base}/`, label: 'خانه' },
		{ href: `${base}/add`, label: 'ایجاد ختم' },
		{ href: `${base}/list`, label: 'فهرست عمومی' },
		{ href: `${base}/history`, label: 'تاریخچه' },
		{ href: `${base}/settings`, label: 'تنظیمات' },
	]

	function isActive(href: string) {
		if (href === `${base}/`) return page.url.pathname === href
		return page.url.pathname.startsWith(href)
	}

	function back() {
		if (from) {
			history.back()
		} else {
			goto(`${base}/`, { replaceState: true })
		}
	}

	function handleKeyboard(event: KeyboardEvent) {
		if (event.key === 'Escape') open = false
	}
</script>

<svelte:document onkeyup={handleKeyboard} />

<header class="ui-header">
	<div class="ui-header-inner">
		<div class="ui-header-context">
			{#if start}
				{@render start()}
			{:else if title}
				<button type="button" class="ui-btn ui-btn-icon ui-btn-ghost" aria-label="بازگشت" onclick={back}>
					<IconBack />
				</button>
			{/if}

			{#if title}
				<h1 class="ui-header-title select-none">
					{#if link}
						<a href={link}>{title}</a>
					{:else}
						{title}
					{/if}
				</h1>
			{:else}
				<a class="ui-header-brand" href={`${base}/`} aria-label="سامانه ختم جمعی قرآن">
					<img src={`${base}/hero.png`} width="40" height="40" alt="" />
					<span>سامانه ختم جمعی قرآن</span>
				</a>
			{/if}
		</div>

		<nav class="ui-nav ui-desktop-only" aria-label="ناوبری اصلی">
			{#each links as navLink}
				<a
					class="ui-nav-link"
					class:ui-nav-link-active={isActive(navLink.href)}
					href={navLink.href}
					aria-current={isActive(navLink.href) ? 'page' : undefined}
				>
					{navLink.label}
				</a>
			{/each}
		</nav>

		<div class="ui-header-actions">
			{#if end}
				{@render end()}
			{/if}

			<button
				type="button"
				class="ui-btn ui-btn-ghost ui-btn-icon ui-mobile-only"
				aria-label={open ? 'بستن منو' : 'باز کردن منو'}
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				{#if open}<IconClose class="size-6" />{:else}<IconMenu class="size-6" />{/if}
			</button>
		</div>

		{#if open}
			<nav class="ui-mobile-menu ui-mobile-only" aria-label="ناوبری موبایل">
				{#each links as navLink}
					<a
						class="ui-nav-link"
						class:ui-nav-link-active={isActive(navLink.href)}
						href={navLink.href}
						onclick={() => (open = false)}
						aria-current={isActive(navLink.href) ? 'page' : undefined}
					>
						{navLink.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</header>
