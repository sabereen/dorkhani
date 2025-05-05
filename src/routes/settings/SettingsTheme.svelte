<script lang="ts">
	import ThemeButton from '$lib/components/ThemeButton.svelte'
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import { daisyThemes } from '$lib/entity/Theme'

	const { class: className = undefined as string | undefined } = $props()

	const editor = SettingsEditor.use()
	editor.live = true
</script>

<div>
	<fieldset
		class={['fieldset bg-base-200 border-base-300 rounded-box w-xs border px-4 !pb-4', className]}
	>
		<legend class="fieldset-legend">پوسته</legend>
		<div class="grid grid-cols-2 gap-2">
			{#each daisyThemes as { name, slug }}
				<ThemeButton theme={slug} title={name} />
			{/each}
		</div>
	</fieldset>
</div>
