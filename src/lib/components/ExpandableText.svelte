<script lang="ts">
	type Props = {
		text: string
		maxLength?: number
		threshold?: number
	}

	const { text, maxLength = text.length }: Props = $props()

	let open = $state(false)

	const firstPart = $derived(text.slice(0, maxLength))
	const secondPart = $derived(text.slice(firstPart.length))
</script>

<!-- استفاده از دیتیلز سامری صرفا برای دسترس‌پذیری است -->
<span class="whitespace-pre-wrap">{open || !secondPart ? text : `${firstPart}...`}</span>
{#if secondPart}
	<details bind:open class="inline">
		<summary class="link text-primary inline-block text-sm">
			{#if open}
				کمتر
			{:else}
				ادامه
			{/if}
		</summary>
		{#if !open}
			<span class="whitespace-pre-wrap">{secondPart}</span>
		{/if}
	</details>
{/if}
