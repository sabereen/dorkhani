<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { authClient } from '$lib/auth-client'
	import { page } from '$app/state'
	import { base } from '$app/paths'

	let password = $state('')
	let completed = $state(false)
	let errorMessage = $state('')

	async function submit(event: SubmitEvent) {
		event.preventDefault()
		const result = await authClient.resetPassword({
			newPassword: password,
			token: page.url.searchParams.get('token') || '',
		})
		if (result.error) errorMessage = result.error.message || 'تغییر رمز ناموفق بود.'
		else completed = true
	}
</script>

<svelte:head><title>رمز تازه | ختم قرآن</title></svelte:head>
<Header title="انتخاب رمز تازه" />
<div class="mx-auto mt-4 max-w-sm">
	{#if completed}
		<div class="ui-alert ui-alert-success">رمز عبور تغییر کرد.</div>
		<a class="ui-btn ui-btn-primary mt-3 w-full" href={`${base}/auth/login`}>ورود</a>
	{:else}
		{#if errorMessage}<div class="ui-alert ui-alert-error mb-3">{errorMessage}</div>{/if}
		<form class="ui-card ui-card-bordered" onsubmit={submit}>
			<div class="ui-card-body grid gap-3">
				<label class="grid gap-1">رمز تازه<input class="ui-input" type="password" bind:value={password} minlength="8" required /></label>
				<button class="ui-btn ui-btn-primary" type="submit">ذخیره رمز</button>
			</div>
		</form>
	{/if}
</div>
