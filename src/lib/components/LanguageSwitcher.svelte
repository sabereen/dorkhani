<script lang="ts">
	import { page } from '$app/state'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localeLabel } from '$lib/i18n/client'
	import * as m from '$lib/paraglide/messages.js'
	import LanguageModal from './LanguageModal.svelte'
	import IconLanguage from '~icons/ic/round-language'

	let {
		compact = false,
		menuItem = false,
		onopen,
	}: { compact?: boolean; menuItem?: boolean; onopen?: () => void } = $props()
	const locale = $derived(getLocale())
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'))
	let open = $state(false)
</script>

{#if !isAdmin}
	<div class:ui-language-switcher-compact={compact} class="ui-language-switcher">
		<button
			class={menuItem ? 'ui-nav-link' : 'ui-language-switcher-button'}
			type="button"
			aria-label={`${m.language_selector_label()}: ${localeLabel(locale)}`}
			title={localeLabel(locale)}
			onclick={() => {
				onopen?.()
				open = true
			}}
		>
			<IconLanguage class="ui-language-icon" aria-hidden="true" />
			{#if menuItem}<span>{m.language_selector_label()}: {localeLabel(locale)}</span>{/if}
		</button>
	</div>
	<LanguageModal bind:open />
{/if}
