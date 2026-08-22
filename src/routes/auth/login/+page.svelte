<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { authClient } from '$lib/auth-client'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import IconEmail from '~icons/ic/round-email'
	import IconLanguage from '~icons/ic/round-language'
	import IconLock from '~icons/ic/round-lock'
	import IconLogin from '~icons/ic/round-login'
	import IconVisibility from '~icons/ic/round-visibility'
	import IconVisibilityOff from '~icons/ic/round-visibility-off'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
	let email = $state('')
	let password = $state('')
	let loading = $state(false)
	let errorMessage = $state('')
	let showPassword = $state(false)

	async function finishLogin() {
		await claimCreatedKhatms()
		await invalidateAll()
		await goto(`${base}/account`)
	}

	async function signInEmail(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.signIn.email({ email, password })
		loading = false
		if (result.error) {
			errorMessage = result.error.message || 'ورود ناموفق بود.'
			return
		}
		await finishLogin()
	}

	async function signInGoogle() {
		loading = true
		errorMessage = ''
		await authClient.signIn.social({ provider: 'google', callbackURL: `${base}/account` })
		loading = false
	}

</script>

<svelte:head>
	<title>ورود | ختم قرآن</title>
</svelte:head>

<AuthShell
	title="ورود به حساب"
	eyebrow="خوش آمدید"
	description="برای ادامه، اطلاعات حساب کاربری خود را وارد کنید."
>
	<div class="ui-form-status-slot" aria-live="polite">
		{#if errorMessage}
			<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
		{/if}
	</div>

	<form use:validateForm novalidate class="ui-auth-form" onsubmit={signInEmail} aria-busy={loading}>
		<div class="ui-auth-field">
			<label class="ui-field-label" for="login-email"><IconEmail /> ایمیل</label>
			<input
				id="login-email"
				dir="ltr"
				class="ui-input"
				type="email"
				bind:value={email}
				autocomplete="email"
				placeholder="name@example.com"
				spellcheck="false"
				required
			/>
		</div>

		<div class="ui-auth-field">
			<div class="ui-auth-label-row">
				<label class="ui-field-label" for="login-password"><IconLock /> رمز عبور</label>
				<a class="ui-link" href={`${base}/auth/forgot-password`}>فراموش کرده‌ام</a>
			</div>
			<div class="ui-auth-password-wrap" data-ui-validation-host>
				<input
					id="login-password"
					dir="ltr"
					class="ui-input"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					autocomplete="current-password"
					placeholder="رمز عبور"
					required
				/>
				<button
					class="ui-auth-password-toggle"
					type="button"
					aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
					aria-pressed={showPassword}
					onclick={() => (showPassword = !showPassword)}
				>
					{#if showPassword}<IconVisibilityOff />{:else}<IconVisibility />{/if}
				</button>
			</div>
		</div>

		<button class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" type="submit" disabled={loading}>
			{#if loading}<span class="ui-spinner"></span>{:else}<IconLogin />{/if}
			<span>{loading ? 'در حال ورود…' : 'ورود به حساب'}</span>
		</button>
	</form>

	{#if data.authProviders.google}
		<div class="ui-auth-divider"><span>یا ادامه با</span></div>
		<div class="ui-auth-socials">
			{#if data.authProviders.google}
				<button
					class="ui-btn ui-btn-outline"
					type="button"
					onclick={signInGoogle}
					disabled={loading}
				>
					<IconLanguage />
					<span>گوگل</span>
				</button>
			{/if}
		</div>
	{/if}

	<p class="ui-auth-switch">
		حساب کاربری ندارید؟ <a href={`${base}/auth/register`}>ساخت حساب جدید</a>
	</p>
</AuthShell>
