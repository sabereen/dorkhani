<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { authClient } from '$lib/auth-client'
	import { base } from '$app/paths'

	let name = $state('')
	let email = $state('')
	let password = $state('')
	let loading = $state(false)
	let errorMessage = $state('')
	let sent = $state(false)

	async function register(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.signUp.email({ name, email, password, callbackURL: `${base}/account` })
		loading = false
		if (result.error) errorMessage = result.error.message || 'ثبت‌نام ناموفق بود.'
		else sent = true
	}
</script>

<svelte:head><title>ثبت‌نام | ختم قرآن</title></svelte:head>
<Header title="ساخت حساب" />
<div class="mx-auto mt-4 max-w-sm">
	{#if sent}
		<div class="ui-alert ui-alert-success">پیوند تأیید به ایمیل شما ارسال شد.</div>
	{:else}
		{#if errorMessage}<div class="ui-alert ui-alert-error mb-3">{errorMessage}</div>{/if}
		<form class="ui-card ui-card-bordered" onsubmit={register}>
			<div class="ui-card-body grid gap-3">
				<label class="grid gap-1">نام<input class="ui-input" bind:value={name} autocomplete="name" required /></label>
				<label class="grid gap-1">ایمیل<input class="ui-input" type="email" bind:value={email} autocomplete="email" required /></label>
				<label class="grid gap-1">رمز عبور<input class="ui-input" type="password" bind:value={password} minlength="8" autocomplete="new-password" required /></label>
				<button class="ui-btn ui-btn-primary" type="submit" disabled={loading}>ثبت‌نام</button>
			</div>
		</form>
	{/if}
	<a class="ui-btn ui-btn-ghost mt-3 w-full" href={`${base}/auth/login`}>بازگشت به ورود</a>
</div>
