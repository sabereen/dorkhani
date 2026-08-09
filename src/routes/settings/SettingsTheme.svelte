<script lang="ts">
	import ColorSchemeButton from '$lib/components/ColorSchemeButton.svelte'
	import { colorSchemes } from '$lib/entity/Theme'

	const { class: className = undefined as string | undefined } = $props()

</script>

<div>
	<fieldset class={['ui-fieldset', className]}>
		<legend class="ui-fieldset-legend">پوسته</legend>
		<div class="ui-scheme-options">
			{#each colorSchemes as { name, slug }}
				<ColorSchemeButton scheme={slug} title={name} />
			{/each}
		</div>
	</fieldset>
</div>
