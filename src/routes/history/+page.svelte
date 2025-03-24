<script>
	import Header from '$lib/components/Header.svelte'
	import History from './history.svelte'
</script>

<Header title="تاریخچه مشارکت‌های شما" />

<History>
	{#snippet fallback()}
		<div class="alert alert-info mt-4">موردی جهت نمایش وجود ندارد</div>
	{/snippet}
</History>
