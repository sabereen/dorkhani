<script lang="ts">
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
</script>

<h1 class="mb-5 text-3xl">سامانه ختم قرآن</h1>

<div>
	<a class="btn btn-primary" href="/add">تعریف ختم جدید</a>
</div>

<section>
	<h2>آخرین ختم‌های ثبت شده</h2>
	<ul>
		{#each data.khatms as khatm}
			<li>
				<a href="/khatm/{khatm.id}">{khatm.title}</a>
			</li>
		{/each}
	</ul>
</section>
