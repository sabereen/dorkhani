<script lang="ts">
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import { authClient } from '$lib/auth-client'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconLock from '~icons/ic/round-lock'
	import IconSave from '~icons/ic/round-save'
	import IconVisibility from '~icons/ic/round-visibility'
	import IconVisibilityOff from '~icons/ic/round-visibility-off'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'

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
		if (result.error) errorMessage = result.error.message || m.auth_reset_failed()
		else completed = true
	}
</script>

<PageTitle title={m.auth_reset_title()} />

<AuthShell
	title={m.auth_reset_title()}
	eyebrow={m.auth_reset_eyebrow()}
	description={m.auth_reset_description()}
>
	{#if completed}
		<div class="ui-auth-success" role="status">
			<span class="ui-auth-success-icon"><IconCheck /></span>
			<h3>{m.auth_reset_completed_title()}</h3>
			<p>{m.auth_reset_completed_text()}</p>
			<a class="ui-btn ui-btn-primary ui-btn-block" href={localizeHref(`${base}/auth/login`)}>{m.auth_login_action()}</a>
		</div>
	{:else}
		<div class="ui-form-status-slot" aria-live="polite">
			{#if errorMessage}
				<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
			{/if}
		</div>

		<form use:validateForm novalidate class="ui-auth-form" onsubmit={submit} aria-busy={loading}>
			<div class="ui-auth-field">
				<label class="ui-field-label" for="new-password"><IconLock /> {m.auth_new_password()}</label>
				<div class="ui-auth-password-wrap" data-ui-validation-host>
					<input
						id="new-password"
						class="ui-input"
						dir="ltr"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						minlength="8"
						autocomplete="new-password"
						placeholder={m.auth_password_placeholder()}
						required
					/>
					<button
						class="ui-auth-password-toggle"
						type="button"
						aria-label={showPassword ? m.auth_hide_password() : m.auth_show_password()}
						aria-pressed={showPassword}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}<IconVisibilityOff />{:else}<IconVisibility />{/if}
					</button>
				</div>
				<small class="ui-auth-hint">{m.auth_password_hint()}</small>
			</div>
			<button class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" type="submit" disabled={loading}>
				{#if loading}<span class="ui-spinner"></span>{:else}<IconSave />{/if}
				<span>{loading ? m.auth_saving() : m.auth_save_new_password()}</span>
			</button>
		</form>
	{/if}
</AuthShell>
