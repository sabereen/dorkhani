<script lang="ts">
	import { base } from '$app/paths'
	import { authClient } from '$lib/auth-client'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconEmail from '~icons/ic/round-email'
	import IconLock from '~icons/ic/round-lock'
	import IconPerson from '~icons/ic/round-person'
	import IconPersonAdd from '~icons/ic/round-person-add-alt'
	import IconVisibility from '~icons/ic/round-visibility'
	import IconVisibilityOff from '~icons/ic/round-visibility-off'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import { publicWebUrl } from '$lib/config/runtime'

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
			callbackURL: publicWebUrl(localizeHref(`${base}/account`)),
		})
		loading = false
		if (result.error) errorMessage = result.error.message || m.auth_register_failed()
		else sent = true
	}
</script>

<PageTitle title={m.auth_register_title()} />

<AuthShell
	title={m.auth_register_heading()}
	eyebrow={m.auth_register_eyebrow()}
	description={m.auth_register_description()}
>
	{#if sent}
		<div class="ui-auth-success" role="status">
			<span class="ui-auth-success-icon"><IconCheck /></span>
			<h3>{m.auth_verification_sent_title()}</h3>
			<p>{m.auth_verification_sent_text()}</p>
			<a class="ui-btn ui-btn-primary ui-btn-block" href={localizeHref(`${base}/auth/login`)}>{m.auth_go_to_login()}</a
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
				<label class="ui-field-label" for="register-name"><IconPerson /> {m.auth_full_name()}</label>
				<input id="register-name" class="ui-input" bind:value={name} autocomplete="name" required />
			</div>

			<div class="ui-auth-field">
				<label class="ui-field-label" for="register-email"><IconEmail /> {m.auth_email()}</label>
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
				<label class="ui-field-label" for="register-password"><IconLock /> {m.auth_password()}</label>
				<div class="ui-auth-password-wrap" data-ui-validation-host>
					<input
						id="register-password"
						class="ui-input"
						type={showPassword ? 'text' : 'password'}
						dir="ltr"
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
				{#if loading}<span class="ui-spinner"></span>{:else}<IconPersonAdd />{/if}
				<span>{loading ? m.auth_register_loading() : m.auth_register_heading()}</span>
			</button>
		</form>
	{/if}

	{#if !sent}
		<p class="ui-auth-switch">{m.auth_has_account()} <a href={localizeHref(`${base}/auth/login`)}>{m.auth_login_action()}</a></p>
	{/if}
</AuthShell>
