<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import { validateForm } from '$lib/actions/validateForm'
	import SettingsAyahKhatm from './SettingsAyahKhatm.svelte'
	import SettingsTheme from './SettingsTheme.svelte'
</script>

<PageTitle title="تنظیمات" />

<Header title="تنظیمات">
	{#snippet end()}{/snippet}
</Header>

<form
	use:validateForm
	novalidate
	class="flex flex-col items-center p-2"
	action=""
	method="POST"
	onsubmit={(e) => e.preventDefault()}
>
	<SettingsTheme class="w-full!" />
	<SettingsAyahKhatm class="mt-3" legend="تنظیمات ختم آیه به آیه" />
</form>
