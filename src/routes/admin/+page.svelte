<script>
	import Header from '$lib/components/Header.svelte'
	import { base } from '$app/paths'
	import IconShowcase from '~icons/ic/baseline-storefront'
	import IconSettings from '~icons/ic/round-settings'
</script>

<svelte:head>
	<title>ختم قرآن | مدیریت</title>
</svelte:head>

<Header title="مدیریت" />

<section class="mt-5">
	<ul class="grid-gap-2 grid grid-cols-2">
		<li>
			<a class="btn !btn-soft btn-primary w-full" href={`${base}/admin/app-settings`}>
				<IconSettings class="size-7" />
				تنظیمات کلی
			</a>
		</li>

		<li>
			<a class="btn !btn-soft btn-primary w-full" href={`${base}/admin/showcase`}>
				<IconShowcase class="size-7" />
				ختم‌های صفحه اصلی
			</a>
		</li>
	</ul>
</section>
