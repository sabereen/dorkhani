<script lang="ts">
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
</script>

<h1 class="mb-5 text-3xl">جزئیات ختم «{data.khatm.title}»</h1>

<p>{data.khatm.description}</p>

<ul>
	{#each data.khatm.parts as part}
		<li>{part.start}</li>
		<li>{part.end}</li>
	{/each}
</ul>
