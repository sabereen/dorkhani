<script lang="ts">
	import type { Snippet } from 'svelte'
	import { fade, scale } from 'svelte/transition'
	import { tick } from 'svelte'
	import * as m from '$lib/paraglide/messages.js'

	type Props = {
		open?: boolean
		children?: Snippet
		class?: string
		contentClass?: string
		labelledBy?: string
		closeOnBackdrop?: boolean
		closeOnEscape?: boolean
	}

	let {
		open = $bindable(false),
		children,
		contentClass,
		class: className,
		labelledBy,
		closeOnBackdrop = true,
		closeOnEscape = true,
	}: Props = $props()
	let modalBox = $state<HTMLElement>()

	function mountToBody(node: HTMLElement) {
		document.body.appendChild(node)
		// Svelte's original DOM range no longer contains this portalled node.
		return {
			destroy() {
				node.remove()
			},
		}
	}

	function close() {
		open = false
	}

	function handleBackdrop() {
		if (closeOnBackdrop) close()
	}

	function getFocusableElements() {
		if (!modalBox) return []
		return Array.from(
			modalBox.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]',
			),
		).filter((element) => element.tabIndex >= 0)
	}

	function handleKeyboard(event: KeyboardEvent) {
		if (!open) return
		if (event.key === 'Escape') {
			if (closeOnEscape) close()
			return
		}
		if (event.key !== 'Tab') return

		const focusable = getFocusableElements()
		if (!focusable.length) {
			event.preventDefault()
			modalBox?.focus()
			return
		}
		const first = focusable[0]
		const last = focusable[focusable.length - 1]
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault()
			last.focus()
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault()
			first.focus()
		}
	}

	$effect(() => {
		if (!open) return
		const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
		let active = true
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		tick().then(() => {
			if (active && open && modalBox?.isConnected) {
				(getFocusableElements()[0] || modalBox).focus()
			}
		})

		return () => {
			active = false
			document.body.style.overflow = previousOverflow
			if (returnFocus?.isConnected) returnFocus.focus()
		}
	})
</script>

<svelte:document onkeydown={handleKeyboard} />

{#if open}
	<div use:mountToBody class={['ui-modal', className]} out:fade role="presentation">
		<button
			in:fade|global
			type="button"
			aria-label={m.common_close()}
			class="ui-modal-backdrop"
			onclick={handleBackdrop}
		></button>
		<div
			bind:this={modalBox}
			class={['ui-modal-box', contentClass]}
			transition:scale|global={{ start: 0.92, opacity: 0 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={labelledBy}
			tabindex="-1"
		>
			{@render children?.()}
		</div>
	</div>
{/if}
