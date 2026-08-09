<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import IconMenu from '~icons/ic/round-menu'
	import IconClose from '~icons/ic/round-close'

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

	function handleKeyboard(event: KeyboardEvent) {
		if (event.key === 'Escape') open = false
	}
</script>

<svelte:document onkeyup={handleKeyboard} />

<header class="ui-header">
	<div class="ui-container ui-header-inner">
		<a class="ui-header-brand" href={`${base}/`} aria-label="سامانه ختم جمعی قرآن">
			<img src={`${base}/hero.png`} width="40" height="40" alt="" />
			<span>سامانه ختم جمعی قرآن</span>
		</a>

		<nav class="ui-nav ui-desktop-only" aria-label="ناوبری اصلی">
			{#each links as link}
				<a
					class="ui-nav-link"
					class:ui-nav-link-active={isActive(link.href)}
					href={link.href}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<button
			type="button"
			class="ui-btn ui-btn-ghost ui-btn-icon ui-mobile-only"
			aria-label={open ? 'بستن منو' : 'باز کردن منو'}
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			{#if open}<IconClose class="size-6" />{:else}<IconMenu class="size-6" />{/if}
		</button>

		{#if open}
			<nav class="ui-mobile-menu ui-mobile-only" aria-label="ناوبری موبایل">
				{#each links as link}
					<a
						class="ui-nav-link"
						class:ui-nav-link-active={isActive(link.href)}
						href={link.href}
						onclick={() => (open = false)}
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</header>
