<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import SettingsAyahKhatm from './SettingsAyahKhatm.svelte'
</script>

<svelte:head>
	<title>ختم قرآن | تنظیمات</title>
</svelte:head>

<Header title="تنظیمات" />

<form class="flex justify-center p-2" action="" method="POST" onsubmit={(e) => e.preventDefault()}>
	<SettingsAyahKhatm />
</form>
