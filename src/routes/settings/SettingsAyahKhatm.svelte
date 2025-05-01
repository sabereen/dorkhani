<script lang="ts">
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import { PUBLIC_FONT_PROXY } from '$env/static/public'

	const editor = SettingsEditor.use()
	editor.live = true

	const fontProxy = PUBLIC_FONT_PROXY === '1'

	const { class: className = undefined } = $props()
</script>

<fieldset
	class={['fieldset bg-base-200 border-base-300 rounded-box w-xs border px-4 !pb-4', className]}
>
	<legend class="fieldset-legend"> تنظیمات ختم آیه به آیه </legend>

	<label for="input-translation" class="fieldset-label mt-2">ترجمه</label>
	<select
		id="input-translation"
		class="select"
		name="translation"
		bind:value={editor.config.translation}
	>
		<option value="ansarian">انصاریان</option>
		<option value="makarem">مکارم شیرازی</option>
		<option value="gharaati">قرائتی</option>
	</select>

	{#if fontProxy}
		<label for="input-font" class="fieldset-label mt-2">فونت</label>
		<select id="input-font" class="select" name="font" bind:value={editor.config.quranFont}>
			<option value="hafs">پیش‌فرض</option>
			<option value="qpc1">مصحف مدینه ۱</option>
			<option value="qpc2">مصحف مدینه ۲</option>
		</select>
	{/if}

	<label for="input-reciter" class="fieldset-label mt-2">قاری</label>
	<select id="input-reciter" class="select" name="reciter" bind:value={editor.config.reciter}>
		<option value="parhizgar">پرهیزگار</option>
		<option value="minshawi">منشاوی</option>
		<option value="husari">خلیل الحصری</option>
		<option value="alafasi">العفاسی</option>
		<option value="abdulbasit">عبد الباسط</option>
	</select>
</fieldset>
