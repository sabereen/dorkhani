<script>
	import Header from '$lib/components/Header.svelte'
	import HistoryKhatm from './history-khatm.svelte'
	import HistoryPickedRange from './history-picked-range.svelte'
</script>

<Header title="تاریخچه ختم‌ها و مشارکت‌های شما" />

<div class="mt-4">
	<h2 class="mb-1 text-xl font-bold">ختم‌هایی که ایجاد کرده اید:</h2>
	<HistoryKhatm>
		{#snippet fallback()}
			<div class="alert alert-info mt-4">موردی جهت نمایش وجود ندارد</div>
		{/snippet}
	</HistoryKhatm>
</div>

<div class="mt-4">
	<h2 class="mb-1 text-xl font-bold">بازه‌هایی که برای قرائت پذیرفته اید:</h2>
	<HistoryPickedRange>
		{#snippet fallback()}
			<div class="alert alert-info mt-4">موردی جهت نمایش وجود ندارد</div>
		{/snippet}
	</HistoryPickedRange>
</div>
