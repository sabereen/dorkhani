<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import IconDashboard from '~icons/ic/round-home'
	import IconReview from '~icons/ic/outline-check-box'
	import IconZekr from '~icons/ic/baseline-storefront'
	import IconSettings from '~icons/ic/round-settings'

	const items = [
		{ href: `${base}/admin`, label: 'پیشخوان', icon: IconDashboard, exact: true },
		{ href: `${base}/admin/review`, label: 'بررسی ختم‌ها', icon: IconReview },
		{ href: `${base}/admin/add-zekr`, label: 'افزودن ذکر', icon: IconZekr },
		{ href: `${base}/admin/app-settings`, label: 'تنظیمات', icon: IconSettings },
	]

	function isActive(href: string, exact = false) {
		return exact
			? page.url.pathname === href || page.url.pathname === `${href}/`
			: page.url.pathname.startsWith(href)
	}
</script>

<nav class="ui-admin-nav" aria-label="ناوبری مدیریت">
	{#each items as item}
		{@const ItemIcon = item.icon}
		<a
			class="ui-admin-nav-link"
			class:ui-admin-nav-link-active={isActive(item.href, item.exact)}
			href={item.href}
			aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
		>
			<ItemIcon aria-hidden="true" />
			<span>{item.label}</span>
		</a>
	{/each}
</nav>
