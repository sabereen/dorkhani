<script lang="ts">
	import { base } from '$app/paths'
	import { authClient } from '$lib/auth-client'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconEmail from '~icons/ic/round-email'
	import IconLock from '~icons/ic/round-lock'
	import IconPerson from '~icons/ic/round-person'
	import IconPersonAdd from '~icons/ic/round-person-add-alt'
	import IconVisibility from '~icons/ic/round-visibility'
	import IconVisibilityOff from '~icons/ic/round-visibility-off'

	let name = $state('')
	let email = $state('')
	let password = $state('')
	let loading = $state(false)
	let errorMessage = $state('')
	let sent = $state(false)
	let showPassword = $state(false)

	async function register(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.signUp.email({
			name,
			email,
			password,
			callbackURL: `${base}/account`,
		})
		loading = false
		if (result.error) errorMessage = result.error.message || 'ثبت‌نام ناموفق بود.'
		else sent = true
	}
</script>

<svelte:head><title>ثبت‌نام | ختم قرآن</title></svelte:head>

<AuthShell
	title="ساخت حساب کاربری"
	eyebrow="شروع یک همراهی"
	description="در کمتر از یک دقیقه حساب خود را بسازید و سوابق ختم‌ها را نگه دارید."
>
	{#if sent}
		<div class="ui-auth-success" role="status">
			<span class="ui-auth-success-icon"><IconCheck /></span>
			<h3>ایمیل شما در راه است</h3>
			<p>پیوند تأیید به ایمیل شما ارسال شد. برای تکمیل ساخت حساب، صندوق ورودی خود را بررسی کنید.</p>
			<a class="ui-btn ui-btn-primary ui-btn-block" href={`${base}/auth/login`}>رفتن به صفحه ورود</a
			>
		</div>
	{:else}
		<div class="ui-form-status-slot" aria-live="polite">
			{#if errorMessage}
				<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
			{/if}
		</div>

		<form use:validateForm novalidate class="ui-auth-form" onsubmit={register} aria-busy={loading}>
			<div class="ui-auth-field">
				<label class="ui-field-label" for="register-name"><IconPerson /> نام و نام خانوادگی</label>
				<input id="register-name" class="ui-input" bind:value={name} autocomplete="name" required />
			</div>

			<div class="ui-auth-field">
				<label class="ui-field-label" for="register-email"><IconEmail /> ایمیل</label>
				<input
					id="register-email"
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
				<label class="ui-field-label" for="register-password"><IconLock /> رمز عبور</label>
				<div class="ui-auth-password-wrap" data-ui-validation-host>
					<input
						id="register-password"
						class="ui-input"
						type={showPassword ? 'text' : 'password'}
						dir="ltr"
						bind:value={password}
						minlength="8"
						autocomplete="new-password"
						placeholder="حداقل ۸ نویسه"
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
				<small class="ui-auth-hint">رمز عبور باید دست‌کم ۸ نویسه باشد.</small>
			</div>

			<button class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" type="submit" disabled={loading}>
				{#if loading}<span class="ui-spinner"></span>{:else}<IconPersonAdd />{/if}
				<span>{loading ? 'در حال ساخت حساب…' : 'ساخت حساب کاربری'}</span>
			</button>
		</form>
	{/if}

	{#if !sent}
		<p class="ui-auth-switch">از قبل حساب دارید؟ <a href={`${base}/auth/login`}>ورود به حساب</a></p>
	{/if}
</AuthShell>
