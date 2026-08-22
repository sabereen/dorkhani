<script lang="ts">
	import { page } from '$app/state'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { localeLabel } from '$lib/i18n/client'
	import * as m from '$lib/paraglide/messages.js'
	import LanguageModal from './LanguageModal.svelte'
	import IconLanguage from '~icons/ic/round-language'

	let { compact = false }: { compact?: boolean } = $props()
	const locale = $derived(getLocale())
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'))
	let open = $state(false)
</script>

{#if !isAdmin}
	<div class:ui-language-switcher-compact={compact} class="ui-language-switcher">
		<button
			class="ui-language-switcher-button"
			type="button"
			aria-label={`${m.language_selector_label()}: ${localeLabel(locale)}`}
			title={localeLabel(locale)}
			onclick={() => (open = true)}
		>
			<IconLanguage class="ui-language-icon" aria-hidden="true" />
		</button>
	</div>
	<LanguageModal bind:open />
{/if}
