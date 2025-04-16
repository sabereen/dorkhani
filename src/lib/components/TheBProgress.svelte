<script lang="ts">
	import '@bprogress/core/css'
	import { BProgress } from '@bprogress/core'
	import { beforeNavigate } from '$app/navigation'
	import { onMount } from 'svelte'

	onMount(() => {
		BProgress.configure({
			direction: 'rtl',
			showSpinner: true,
		})
	})

	beforeNavigate((navigation) => {
		BProgress.start()
		navigation.complete.finally(() => {
			BProgress.done()
		})
	})
</script>
