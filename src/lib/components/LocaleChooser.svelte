<script lang="ts">
	import { onMount } from 'svelte'
	import { resolveClientLocale } from '$lib/i18n/locale'
	import { setLocale } from '$lib/paraglide/runtime.js'
	import LanguageModal from './LanguageModal.svelte'

	let { unresolved }: { unresolved: boolean } = $props()
	let visible = $state(false)

	onMount(() => {
		if (!unresolved) return
		const detected = resolveClientLocale()
		if (detected) {
			void setLocale(detected)
			return
		}
		visible = true
	})
</script>

<LanguageModal bind:open={visible} mandatory />
