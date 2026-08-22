<script lang="ts">
	import ColorSchemeButton from '$lib/components/ColorSchemeButton.svelte'
	import { colorSchemes } from '$lib/entity/Theme'
	import IconPalette from '~icons/ic/round-palette'
	import * as m from '$lib/paraglide/messages.js'

	const { class: className = undefined as string | undefined } = $props()
</script>

<fieldset class={['ui-fieldset', 'ui-settings-card', 'ui-settings-theme-card', className]}>
	<legend class="ui-fieldset-legend ui-settings-legend">
		<span class="ui-settings-legend-icon" aria-hidden="true"><IconPalette /></span>
		<span>{m.settings_theme()}</span>
	</legend>

	<div class="ui-settings-intro">
		<div>
			<h2>{m.settings_theme_title()}</h2>
			<p>{m.settings_theme_description()}</p>
		</div>
		<span class="ui-badge ui-badge-info">{m.settings_applies_immediately()}</span>
	</div>

	<div class="ui-scheme-options ui-settings-scheme-options" aria-label={m.settings_theme_selector()}>
		{#each colorSchemes as { name, slug }}
			<ColorSchemeButton scheme={slug} title={slug === 'system' ? m.theme_system() : slug === 'light' ? m.theme_light() : m.theme_dark()} />
		{/each}
	</div>
</fieldset>
