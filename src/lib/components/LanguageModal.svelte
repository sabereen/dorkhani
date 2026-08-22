<script lang="ts">
	import { localeLabel } from '$lib/i18n/client'
	import { getLocale, setLocale, type Locale } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import IconCheck from '~icons/ic/round-check'
	import IconClose from '~icons/ic/round-close'
	import IconLanguage from '~icons/ic/round-language'
	import Modal from './Modal.svelte'

	let {
		open = $bindable(false),
		mandatory = false,
	}: { open?: boolean; mandatory?: boolean } = $props()

	const locale = $derived(getLocale())
	const languages: { value: Locale; label: string }[] = [
		{ value: 'fa', label: localeLabel('fa') },
		{ value: 'ar', label: localeLabel('ar') },
		{ value: 'en', label: localeLabel('en') },
	]
	const titleId = $derived(mandatory ? 'locale-choice-title' : 'language-modal-title')

	function choose(nextLocale: Locale) {
		open = false
		void setLocale(nextLocale)
	}
</script>

<Modal
	bind:open
	contentClass="ui-language-modal"
	labelledBy={titleId}
	closeOnBackdrop={!mandatory}
	closeOnEscape={!mandatory}
>
	<div class="ui-language-modal-content">
		<div class="ui-language-modal-header">
			<div class="ui-language-modal-icon" aria-hidden="true">
				<IconLanguage />
			</div>
			<div class="ui-language-modal-heading">
				<span>{m.language_selector_label()}</span>
				<h2 id={titleId}>{m.language_chooser_title()}</h2>
				<p>{m.language_chooser_description()}</p>
			</div>
			{#if !mandatory}
				<button
					type="button"
					class="ui-language-modal-close"
					aria-label={m.common_close()}
					onclick={() => (open = false)}
				>
					<IconClose />
				</button>
			{/if}
		</div>

		<div class="ui-language-choice-grid">
			{#each languages as language}
				<button
					type="button"
					class="ui-language-choice"
					class:ui-language-choice-active={language.value === locale}
					aria-pressed={language.value === locale}
					onclick={() => choose(language.value)}
				>
					<span class="ui-language-choice-code">{language.value.toUpperCase()}</span>
					<span class="ui-language-choice-name">{language.label}</span>
					{#if language.value === locale}
						<IconCheck class="ui-language-choice-check" aria-hidden="true" />
					{/if}
				</button>
			{/each}
		</div>
	</div>
</Modal>
