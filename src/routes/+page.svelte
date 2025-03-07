<script lang="ts">
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
</script>

<div class="hero">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="mt-4 mb-4 text-5xl font-bold">سامانه ختم قرآن</h1>
			<a class="btn btn-primary" href="/add">تعریف ختم جدید</a>
		</div>
	</div>
</div>

<section>
	<h2 class="">آخرین ختم‌های ثبت شده:</h2>
	<ul class="list">
		{#each data.khatms as khatm}
			<li class="">
				<a class="list-row w-full hover:bg-green-500/15" href="/khatm/{khatm.id}">{khatm.title}</a>
			</li>
		{/each}
	</ul>
</section>
