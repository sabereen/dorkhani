<script lang="ts">
	import MultipleAyah from '$lib/components/Quran/MultipleAyah.svelte'
	import { AudioManager } from '$lib/components/Quran/AudioManager.svelte'
	import type { OfflineKhatmRecord } from '$lib/contracts/domain'
	import { SettingsEditor } from '$lib/entity/LocalSettings.svelte'
	import { QuranRange } from '$lib/entity/Range'
	import { getOfflineAyahInfoRange } from '$lib/offline/quran'
	import * as m from '$lib/paraglide/messages.js'
	import { onMount } from 'svelte'
	import IconBack from '~icons/ic/round-arrow-forward'
	import IconBook from '~icons/ic/round-menu-book'

	type Props = {
		khatm: OfflineKhatmRecord
		range: QuranRange
		onBack: () => void
	}

	const { khatm, range, onBack }: Props = $props()
	const settings = SettingsEditor.use()
	const audioManager = new AudioManager()
	const ayat = $derived(getOfflineAyahInfoRange(range, settings.config.translation))
	let online = $state(false)

	onMount(() => {
		const update = () => {
			online = navigator.onLine
			if (!online) audioManager.pause()
		}
		update()
		window.addEventListener('online', update)
		window.addEventListener('offline', update)
		return () => {
			window.removeEventListener('online', update)
			window.removeEventListener('offline', update)
		}
	})
</script>

<div class="ui-offline-reading">
	<div class="ui-offline-reading-toolbar">
		<button class="ui-btn ui-btn-ghost" type="button" onclick={onBack}
			><IconBack />{m.offline_reading_back()}</button
		>
		<span class="ui-badge ui-badge-info"><IconBook />{khatm.title}</span>
	</div>
	<div class="ui-khatm-reading-marker">
		<IconBook /><span>{m.offline_reading_start({ title: range.getTitle() })}</span>
	</div>
	<section class="ui-khatm-panel">
		<MultipleAyah ayahInfoList={ayat} {audioManager} font="hafs" onlineActions={online} />
	</section>
	<div class="ui-khatm-reading-marker">
		<IconBook /><span>{m.offline_reading_end({ title: range.getTitle() })}</span>
	</div>
	<button class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" type="button" onclick={onBack}>
		{m.offline_reading_back_page()}
	</button>
</div>
