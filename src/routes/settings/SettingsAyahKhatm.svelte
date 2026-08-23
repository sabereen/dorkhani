<script lang="ts">
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import { PUBLIC_FONT_PROXY } from '$env/static/public'
	import IconBook from '~icons/ic/round-menu-book'
	import IconFont from '~icons/ic/round-font-download'
	import IconSave from '~icons/ic/round-save'
	import IconTranslate from '~icons/ic/round-translate'
	import IconVoice from '~icons/ic/round-record-voice-over'
	import { quranTranslationRegistry } from '$lib/entity/QuranTranslation'
	import * as m from '$lib/paraglide/messages.js'

	const editor = SettingsEditor.use()

	const fontProxy = PUBLIC_FONT_PROXY === '1'

	const { class: className = undefined, legend = '' } = $props()
</script>

<fieldset class={['ui-fieldset', 'ui-settings-card', 'ui-settings-reading-card', className]}>
	<legend class="ui-fieldset-legend ui-settings-legend">
		<span class="ui-settings-legend-icon" aria-hidden="true"><IconBook /></span>
		<span>{legend}</span>
	</legend>

	<div class="ui-settings-intro">
		<div>
			<h2>{m.settings_reading_title()}</h2>
			<p>{m.settings_reading_description()}</p>
		</div>
		{#if editor.dirty}
			<span class="ui-badge ui-badge-accent">{m.settings_unsaved()}</span>
		{:else}
			<span class="ui-badge ui-badge-success">{m.settings_saved()}</span>
		{/if}
	</div>

	<div class="ui-settings-fields">
		<div class="ui-settings-field">
			<div class="ui-settings-field-heading">
				<span class="ui-settings-field-icon" aria-hidden="true"><IconTranslate /></span>
				<div>
					<label for="input-translation" class="ui-field-label">{m.translation_label()}</label>
					<span>{m.settings_translation_hint()}</span>
				</div>
			</div>
			<select
				id="input-translation"
				class="ui-select"
				name="translation"
				bind:value={editor.config.translation}
			>
				{#each quranTranslationRegistry as translation}
					<option value={translation.id}>{translation.label()}</option>
				{/each}
			</select>
		</div>

		{#if fontProxy}
			<div class="ui-settings-field">
				<div class="ui-settings-field-heading">
					<span class="ui-settings-field-icon" aria-hidden="true"><IconFont /></span>
					<div>
						<label for="input-font" class="ui-field-label">{m.settings_quran_font()}</label>
						<span>{m.settings_quran_font_hint()}</span>
					</div>
				</div>
				<select id="input-font" class="ui-select" name="font" bind:value={editor.config.quranFont}>
					<option value="hafs">{m.settings_font_default()}</option>
					<option value="qpc1">{m.settings_font_madinah_1()}</option>
					<option value="qpc2">{m.settings_font_madinah_2()}</option>
				</select>
			</div>
		{/if}

		<div class="ui-settings-field">
			<div class="ui-settings-field-heading">
				<span class="ui-settings-field-icon" aria-hidden="true"><IconVoice /></span>
				<div>
					<label for="input-reciter" class="ui-field-label">{m.settings_reciter()}</label>
					<span>{m.settings_reciter_hint()}</span>
				</div>
			</div>
			<select
				id="input-reciter"
				class="ui-select"
				name="reciter"
				bind:value={editor.config.reciter}
			>
				<option value="parhizgar">{m.settings_reciter_parhizgar()}</option>
				<option value="minshawi">{m.settings_reciter_minshawi()}</option>
				<option value="husari">{m.settings_reciter_husari()}</option>
				<option value="abdulbasit">{m.settings_reciter_abdulbasit()}</option>
			</select>
		</div>
	</div>

	<div class="ui-settings-actions">
		<p aria-live="polite">
			{editor.dirty ? m.settings_unsaved_status() : m.settings_saved_status()}
		</p>
		<button
			disabled={!editor.dirty}
			class="ui-btn ui-btn-primary"
			type="button"
			onclick={() => editor.commit()}
		>
			<IconSave aria-hidden="true" />
			{editor.dirty ? m.settings_save_changes() : m.settings_saved()}
		</button>
	</div>
</fieldset>
