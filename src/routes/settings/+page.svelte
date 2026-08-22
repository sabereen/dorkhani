<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { validateForm } from '$lib/actions/validateForm'
	import SettingsAyahKhatm from './SettingsAyahKhatm.svelte'
	import SettingsTheme from './SettingsTheme.svelte'
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte'
	import * as m from '$lib/paraglide/messages.js'
</script>

<PageTitle title={m.settings_title()} />

<Header title={m.settings_title()}>
	{#snippet end()}{/snippet}
</Header>

<form
	use:validateForm
	novalidate
	class="flex flex-col items-center p-2"
	action=""
	method="POST"
	onsubmit={(e) => e.preventDefault()}
>
	<fieldset class="ui-fieldset ui-settings-card w-full!">
		<legend class="ui-fieldset-legend">{m.settings_language()}</legend>
		<p>{m.settings_language_description()}</p>
		<LanguageSwitcher />
	</fieldset>
	<SettingsTheme class="mt-3 w-full!" />
	<SettingsAyahKhatm class="mt-3" legend={m.settings_quran()} />
</form>
