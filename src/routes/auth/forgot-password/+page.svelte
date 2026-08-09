<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { authClient } from '$lib/auth-client'
	import { base } from '$app/paths'

	let email = $state('')
	let sent = $state(false)
	let errorMessage = $state('')

	async function submit(event: SubmitEvent) {
		event.preventDefault()
		const result = await authClient.requestPasswordReset({ email, redirectTo: `${location.origin}${base}/auth/reset-password` })
		if (result.error) errorMessage = result.error.message || 'ارسال ایمیل ناموفق بود.'
		else sent = true
	}
</script>

<svelte:head><title>بازیابی رمز | ختم قرآن</title></svelte:head>
<Header title="بازیابی رمز عبور" />
<div class="mx-auto mt-4 max-w-sm">
	{#if sent}
		<div class="ui-alert ui-alert-success">اگر این ایمیل ثبت شده باشد، پیوند بازیابی برای آن ارسال شد.</div>
	{:else}
		{#if errorMessage}<div class="ui-alert ui-alert-error mb-3">{errorMessage}</div>{/if}
		<form class="ui-card ui-card-bordered" onsubmit={submit}>
			<div class="ui-card-body grid gap-3">
				<label class="grid gap-1">ایمیل<input class="ui-input" type="email" bind:value={email} required /></label>
				<button class="ui-btn ui-btn-primary" type="submit">ارسال پیوند بازیابی</button>
			</div>
		</form>
	{/if}
</div>
