<script lang="ts">
	import ColorSchemeButton from '$lib/components/ColorSchemeButton.svelte'
	import { colorSchemes } from '$lib/entity/Theme'
	import IconPalette from '~icons/ic/round-palette'

	const { class: className = undefined as string | undefined } = $props()
</script>

<fieldset class={['ui-fieldset', 'ui-settings-card', 'ui-settings-theme-card', className]}>
	<legend class="ui-fieldset-legend ui-settings-legend">
		<span class="ui-settings-legend-icon" aria-hidden="true"><IconPalette /></span>
		<span>ظاهر برنامه</span>
	</legend>

	<div class="ui-settings-intro">
		<div>
			<h2>پوستهٔ دلخواهت را انتخاب کن</h2>
			<p>رنگ‌بندی برنامه با انتخاب شما همان لحظه تغییر می‌کند.</p>
		</div>
		<span class="ui-badge ui-badge-info">اعمال فوری</span>
	</div>

	<div class="ui-scheme-options ui-settings-scheme-options" aria-label="انتخاب پوسته">
		{#each colorSchemes as { name, slug }}
			<ColorSchemeButton scheme={slug} title={name} />
		{/each}
	</div>
</fieldset>
