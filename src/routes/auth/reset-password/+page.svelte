<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import { authClient } from '$lib/auth-client'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconLock from '~icons/ic/round-lock'
	import IconSave from '~icons/ic/round-save'
	import IconVisibility from '~icons/ic/round-visibility'
	import IconVisibilityOff from '~icons/ic/round-visibility-off'

	let password = $state('')
	let completed = $state(false)
	let loading = $state(false)
	let errorMessage = $state('')
	let showPassword = $state(false)

	async function submit(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.resetPassword({
			newPassword: password,
			token: page.url.searchParams.get('token') || '',
		})
		loading = false
		if (result.error) errorMessage = result.error.message || 'تغییر رمز ناموفق بود.'
		else completed = true
	}
</script>

<svelte:head><title>رمز تازه | ختم قرآن</title></svelte:head>

<AuthShell
	title="انتخاب رمز تازه"
	eyebrow="یک قدم تا ورود"
	description="یک رمز امن و به‌یادماندنی برای حساب خود انتخاب کنید."
>
	{#if completed}
		<div class="ui-auth-success" role="status">
			<span class="ui-auth-success-icon"><IconCheck /></span>
			<h3>رمز عبور تغییر کرد</h3>
			<p>همه‌چیز آماده است؛ اکنون می‌توانید با رمز تازه وارد حساب خود شوید.</p>
			<a class="ui-btn ui-btn-primary ui-btn-block" href={`${base}/auth/login`}>ورود به حساب</a>
		</div>
	{:else}
		{#if errorMessage}
			<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
		{/if}

		<form class="ui-auth-form" onsubmit={submit} aria-busy={loading}>
			<div class="ui-auth-field">
				<label class="ui-field-label" for="new-password"><IconLock /> رمز عبور تازه</label>
				<div class="ui-auth-password-wrap">
					<input
						id="new-password"
						class="ui-input"
						dir="ltr"
						type={showPassword ? 'text' : 'password'}
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
				{#if loading}<span class="ui-spinner"></span>{:else}<IconSave />{/if}
				<span>{loading ? 'در حال ذخیره…' : 'ذخیره رمز تازه'}</span>
			</button>
		</form>
	{/if}
</AuthShell>
