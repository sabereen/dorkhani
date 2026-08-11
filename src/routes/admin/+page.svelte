<script>
	import Header from '$lib/components/Header.svelte'
	import { base } from '$app/paths'
	import IconShowcase from '~icons/ic/baseline-storefront'
	import IconReview from '~icons/ic/outline-check-box'
	import IconSettings from '~icons/ic/round-settings'
</script>

<svelte:head>
	<title>ختم قرآن | مدیریت</title>
</svelte:head>

<Header title="مدیریت" />

<section class="mt-5">
	<ul class="grid-gap-2 grid grid-cols-2 whitespace-nowrap">
		<li>
			<a class="ui-btn ui-btn-soft w-full" href={`${base}/admin/app-settings`}>
				<IconSettings class="size-7" />
				تنظیمات کلی
			</a>
		</li>

		<li>
			<a class="ui-btn ui-btn-soft w-full" href={`${base}/admin/review`}>
				<IconReview class="size-7" />
				تأیید و رد ختم ها
			</a>
		</li>

		<li>
			<a class="ui-btn ui-btn-soft w-full" href={`${base}/admin/add-zekr`}>
				<IconShowcase class="size-7" />
				افزودن ذکر
			</a>
		</li>
	</ul>
</section>
