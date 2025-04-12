<script lang="ts" module>
	import { fly } from 'svelte/transition'
	import { browser } from '$app/environment'
	import { untrack } from 'svelte'

	type ToastType = 'info' | 'error'

	let state = $state({
		open: false,
		message: '',
		type: 'info' as ToastType,
		counter: 0,
		timer: NaN,
	})

	export function toast(type: ToastType, message: string) {
		if (!browser) return

		untrack(() => {
			state.counter++
			state.open = true
			state.type = type
			state.message = message

			if (!isNaN(state.timer)) window.clearTimeout(state.timer)
			state.timer = window.setTimeout(() => {
				state.open = false
				state.timer = NaN
			}, 5_000)
		})
	}
</script>

{#key state.counter}
	{#if state.open}
		<!-- مقدار باتم صفر برای پشتیبانی مرورگرهای قدیمی نوشته شده است. -->
		<div class="toast toast-bottom toast-end bottom-0 z-10" transition:fly|global={{ y: 75 }}>
			<div class={['alert', state.type === 'info' ? 'alert-info' : 'alert-error']}>
				<span>{state.message}</span>
			</div>
		</div>
	{/if}
{/key}
