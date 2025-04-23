<script>
	import Header from '$lib/components/Header.svelte'
	import { base } from '$app/paths'
	import IconShowcase from '~icons/ic/baseline-storefront'
</script>

<svelte:head>
	<title>ختم قرآن | مدیریت</title>
</svelte:head>

<Header title="مدیریت" />

<section class="mt-5">
	<ul>
		<li>
			<a class="btn !btn-soft btn-primary" href={`${base}/admin/showcase`}>
				<IconShowcase class="size-7" />
				ختم‌های صفحه اصلی
			</a>
		</li>
	</ul>
</section>
