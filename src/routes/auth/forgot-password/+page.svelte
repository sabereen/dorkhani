<script lang="ts">
	import { base } from '$app/paths'
	import { authClient } from '$lib/auth-client'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import IconArrow from '~icons/ic/round-arrow-forward'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconEmail from '~icons/ic/round-email'
	import IconSend from '~icons/ic/round-send'

	let email = $state('')
	let sent = $state(false)
	let loading = $state(false)
	let errorMessage = $state('')

	async function submit(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.requestPasswordReset({
			email,
			redirectTo: `${location.origin}${base}/auth/reset-password`,
		})
		loading = false
		if (result.error) errorMessage = result.error.message || 'ارسال ایمیل ناموفق بود.'
		else sent = true
	}
</script>

<svelte:head><title>بازیابی رمز | ختم قرآن</title></svelte:head>

<AuthShell
	title="بازیابی رمز عبور"
	eyebrow="دوباره همراه شوید"
	description="ایمیل حساب خود را وارد کنید تا پیوند ساخت رمز تازه را برایتان بفرستیم."
>
	{#if sent}
		<div class="ui-auth-success" role="status">
			<span class="ui-auth-success-icon"><IconCheck /></span>
			<h3>ایمیل بازیابی ارسال شد</h3>
			<p>
				اگر این ایمیل ثبت شده باشد، پیوند بازیابی برای آن ارسال شده است. پوشه هرزنامه را هم بررسی
				کنید.
			</p>
			<a class="ui-btn ui-btn-primary ui-btn-block" href={`${base}/auth/login`}>بازگشت به ورود</a>
		</div>
	{:else}
		<div class="ui-form-status-slot" aria-live="polite">
			{#if errorMessage}
				<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
			{/if}
		</div>

		<form use:validateForm novalidate class="ui-auth-form" onsubmit={submit} aria-busy={loading}>
			<div class="ui-auth-field">
				<label class="ui-field-label" for="recovery-email"><IconEmail /> ایمیل حساب</label>
				<input
					id="recovery-email"
					class="ui-input"
					dir="ltr"
					type="email"
					bind:value={email}
					autocomplete="email"
					placeholder="name@example.com"
					spellcheck="false"
					required
				/>
			</div>
			<button class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" type="submit" disabled={loading}>
				{#if loading}<span class="ui-spinner"></span>{:else}<IconSend />{/if}
				<span>{loading ? 'در حال ارسال…' : 'ارسال پیوند بازیابی'}</span>
			</button>
		</form>

		<p class="ui-auth-switch">
			<a href={`${base}/auth/login`}><IconArrow /> بازگشت به ورود</a>
		</p>
	{/if}
</AuthShell>
