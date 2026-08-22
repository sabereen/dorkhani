<script lang="ts">
	import { LocalSettings } from '$lib/entity/LocalSettings.svelte'
	import type { ColorScheme } from '$lib/entity/Theme'

	type Props = {
		scheme: ColorScheme
		title: string
	}

	const { scheme, title }: Props = $props()
	const settings = LocalSettings.use()

	function handleClick() {
		const editor = settings.edit()
		editor.config.colorScheme = scheme
		editor.commit()
	}
</script>

<button
	type="button"
	class="ui-scheme-option"
	class:ui-scheme-option-active={settings.config.colorScheme === scheme}
	onclick={handleClick}
	aria-pressed={settings.config.colorScheme === scheme}
>
	<span class={`ui-scheme-preview ui-scheme-preview-${scheme}`} aria-hidden="true">
		<span></span>
		<span></span>
		<span></span>
	</span>
	<span>{title}</span>
</button>
