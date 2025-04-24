<script lang="ts">
	import '@bprogress/core/css'
	import { BProgress } from '@bprogress/core'
	import { beforeNavigate, afterNavigate } from '$app/navigation'
	import { onMount } from 'svelte'

	onMount(() => {
		BProgress.configure({
			direction: 'rtl',
			showSpinner: true,
		})
	})

	beforeNavigate(() => {
		if (!BProgress.isStarted()) {
			BProgress.start()
		}
	})

	afterNavigate(() => {
		BProgress.done()
	})
</script>
