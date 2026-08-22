<script lang="ts">
	import { page } from '$app/state'
	import { getLocale, setLocale, type Locale } from '$lib/paraglide/runtime.js'
	import { localeLabel } from '$lib/i18n/client'
	import * as m from '$lib/paraglide/messages.js'

	let { compact = false }: { compact?: boolean } = $props()
	const locale = $derived(getLocale())
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'))

	function change(event: Event) {
		void setLocale((event.currentTarget as HTMLSelectElement).value as Locale)
	}
</script>

{#if !isAdmin}
	<label class={compact ? 'block max-w-28' : 'block w-full max-w-48'}>
		<span class="sr-only">{m.language_selector_label()}</span>
		<select class="ui-select h-9 py-1" value={locale} aria-label={m.language_selector_label()} onchange={change}>
			<option value="fa">{localeLabel('fa')}</option>
			<option value="ar">{localeLabel('ar')}</option>
			<option value="en">{localeLabel('en')}</option>
		</select>
	</label>
{/if}
