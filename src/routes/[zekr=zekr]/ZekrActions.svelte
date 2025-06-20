<script lang="ts">
	import '@ghoran/text/fonts/uthmanic-hafs/style.css'
	import { slide } from 'svelte/transition'
	import { toast } from '$lib/components/TheToast.svelte'
	import { wait } from '$lib/utility/wait'
	import type { Zekr } from '$lib/entity/Zekr.svelte'

	type Props = {
		zekr: Zekr
	}

	const { zekr }: Props = $props()

	/** آیا موردی در این ختم توسط کاربر پذیرفته شده است؟ */
	let isPicked = $state(false)

	// عدد -1 نمایش دهنده غیر فعال بودن لودینگ است
	// برای اینکه مشخص باشد روی کدام دکمه لودینگ بخورد تعداد آیات را در لودینگ میریزیم
	// هر دکمه‌ای که تعداد آیاتش با این متغیر یکسان بود باید لودینگ بخورد
	let loading = $state(-1)

	async function pick(count = 1) {
		if (loading !== -1) return

		loading = count

		const waitPromise = wait(1500)

		try {
			await zekr.pick({ count })
		} catch (err) {
			console.error(err)
			toast('error', (err as any)?.message || String(err))
		} finally {
			// برای اینکه بین دو کلیک متوالی مدتی فاصله باشد
			// که کاربر اشتباهی چند مرتبه روی دکمه کلیک نکند
			await waitPromise
			loading = -1
		}
	}
</script>

<div class="mt-5 flex flex-col text-center">
	<p class="text-balance px-4 text-lg">تعدادی را که می‌خواهید مشارکت کنید تایپ کنید:</p>
	<div class="mt-5 px-4">
		<div class="grid grid-cols-2 gap-2">
			{#snippet smallButton(text: string, count: number)}
				<button class="btn btn-outline btn-sm" onclick={() => pick(count)}>
					{#if loading === count}
						<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
					{/if}
					{text}
				</button>
			{/snippet}

			<button
				class="btn btn-primary btn-xl col-span-2 h-[3.3rem] text-xl font-bold"
				onclick={() => pick(1)}
			>
				{#if loading === 1}
					<div class="loading loading-md" transition:slide={{ axis: 'x' }}></div>
				{/if}
				{#if isPicked}
					پذیرفتن یک مرتبه
				{:else}
					پذیرفتن یک مرتبه دیگر
				{/if}
			</button>

			{@render smallButton('پذیرفتن ۳ تا', 3)}
			{@render smallButton('پذیرفتن ۵ تا', 5)}
			{@render smallButton('پذیرفتن ۷ تا', 7)}
			{@render smallButton('پذیرفتن ۱۰ تا', 10)}
		</div>
	</div>
</div>
