<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import SettingsAyahKhatm from './SettingsAyahKhatm.svelte'
	import SettingsTheme from './SettingsTheme.svelte'
</script>

<svelte:head>
	<title>ختم قرآن | تنظیمات</title>
</svelte:head>

<Header title="تنظیمات" />

<form
	class="flex flex-col items-center p-2"
	action=""
	method="POST"
	onsubmit={(e) => e.preventDefault()}
>
	<SettingsTheme />
	<SettingsAyahKhatm legend="تنظیمات ختم آیه به آیه" />
</form>
