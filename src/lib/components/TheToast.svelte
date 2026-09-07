<script lang="ts" module>
	import { fly } from 'svelte/transition'
	import { toastState as state } from './toast.svelte'
</script>

{#key state.counter}
	{#if state.open}
		<!-- مقدار باتم صفر برای پشتیبانی مرورگرهای قدیمی نوشته شده است. -->
		<div class="ui-toast" transition:fly|global={{ y: 75 }}>
			<div
				class={['ui-alert', state.type === 'info' ? 'ui-alert-info' : 'ui-alert-error']}
				role={state.type === 'error' ? 'alert' : 'status'}
				aria-live={state.type === 'error' ? 'assertive' : 'polite'}
			>
				<span>{state.message}</span>
			</div>
		</div>
	{/if}
{/key}
