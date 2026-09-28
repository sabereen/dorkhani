<script lang="ts" module>
	import { fly } from 'svelte/transition'
	import { toastState as state } from './toast.svelte'

	function mountToBody(node: HTMLElement) {
		document.body.appendChild(node)
		return {
			destroy() {
				node.remove()
			},
		}
	}
</script>

{#key state.counter}
	{#if state.open}
		<!-- مقدار باتم صفر برای پشتیبانی مرورگرهای قدیمی نوشته شده است. -->
		<div use:mountToBody class="ui-toast" transition:fly|global={{ y: 75 }}>
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
