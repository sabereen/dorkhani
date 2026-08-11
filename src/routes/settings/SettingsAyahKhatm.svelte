<script lang="ts">
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import { PUBLIC_FONT_PROXY } from '$env/static/public'
	import IconBook from '~icons/ic/round-menu-book'
	import IconFont from '~icons/ic/round-font-download'
	import IconSave from '~icons/ic/round-save'
	import IconTranslate from '~icons/ic/round-translate'
	import IconVoice from '~icons/ic/round-record-voice-over'

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
			<h2>تجربهٔ تلاوت را شخصی‌سازی کن</h2>
			<p>ترجمه، قلم قرآن و صدایی را انتخاب کن که همراه بهتری برای ختم توست.</p>
		</div>
		{#if editor.dirty}
			<span class="ui-badge ui-badge-accent">ذخیره‌نشده</span>
		{:else}
			<span class="ui-badge ui-badge-success">ذخیره‌شده</span>
		{/if}
	</div>

	<div class="ui-settings-fields">
		<div class="ui-settings-field">
			<div class="ui-settings-field-heading">
				<span class="ui-settings-field-icon" aria-hidden="true"><IconTranslate /></span>
				<div>
					<label for="input-translation" class="ui-field-label">ترجمهٔ آیات</label>
					<span>مترجم متن فارسی قرآن</span>
				</div>
			</div>
			<select
				id="input-translation"
				class="ui-select"
				name="translation"
				bind:value={editor.config.translation}
			>
				<option value="ansarian">انصاریان</option>
				<option value="makarem">مکارم شیرازی</option>
				<option value="gharaati">قرائتی</option>
			</select>
		</div>

		{#if fontProxy}
			<div class="ui-settings-field">
				<div class="ui-settings-field-heading">
					<span class="ui-settings-field-icon" aria-hidden="true"><IconFont /></span>
					<div>
						<label for="input-font" class="ui-field-label">قلم قرآن</label>
						<span>شیوهٔ نمایش متن عربی</span>
					</div>
				</div>
				<select
					id="input-font"
					class="ui-select"
					name="font"
					bind:value={editor.config.quranFont}
				>
					<option value="hafs">پیش‌فرض</option>
					<option value="qpc1">مصحف مدینه ۱</option>
					<option value="qpc2">مصحف مدینه ۲</option>
				</select>
			</div>
		{/if}

		<div class="ui-settings-field">
			<div class="ui-settings-field-heading">
				<span class="ui-settings-field-icon" aria-hidden="true"><IconVoice /></span>
				<div>
					<label for="input-reciter" class="ui-field-label">قاری</label>
					<span>صدای پخش آیات قرآن</span>
				</div>
			</div>
			<select
				id="input-reciter"
				class="ui-select"
				name="reciter"
				bind:value={editor.config.reciter}
			>
				<option value="parhizgar">پرهیزگار</option>
				<option value="minshawi">منشاوی</option>
				<option value="husari">خلیل الحصری</option>
				<option value="abdulbasit">عبد الباسط</option>
			</select>
		</div>
	</div>

	<div class="ui-settings-actions">
		<p aria-live="polite">
			{editor.dirty ? 'تغییرات آمادهٔ ذخیره‌شدن هستند.' : 'همهٔ تنظیمات ذخیره شده‌اند.'}
		</p>
		<button
			disabled={!editor.dirty}
			class="ui-btn ui-btn-primary"
			type="button"
			onclick={() => editor.commit()}
		>
			<IconSave aria-hidden="true" />
			{editor.dirty ? 'ذخیرهٔ تغییرات' : 'ذخیره‌شده'}
		</button>
	</div>
</fieldset>
