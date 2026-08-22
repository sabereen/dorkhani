<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { authClient } from '$lib/auth-client'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconEmail from '~icons/ic/round-email'
	import IconLanguage from '~icons/ic/round-language'
	import IconLock from '~icons/ic/round-lock'
	import IconLogin from '~icons/ic/round-login'
	import IconVisibility from '~icons/ic/round-visibility'
	import IconVisibilityOff from '~icons/ic/round-visibility-off'
	import type { PageProps } from './$types'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import { isCapacitorBuild } from '$lib/config/runtime'

	const { data }: PageProps = $props()
	let email = $state('')
	let password = $state('')
	let loading = $state(false)
	let errorMessage = $state('')
	let showPassword = $state(false)

	async function finishLogin() {
		await claimCreatedKhatms()
		await invalidateAll()
		await goto(localizeHref(`${base}/account`))
	}

	async function signInEmail(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.signIn.email({ email, password })
		loading = false
		if (result.error) {
			errorMessage = result.error.message || m.auth_login_failed()
			return
		}
		await finishLogin()
	}

	async function signInGoogle() {
		loading = true
		errorMessage = ''
		await authClient.signIn.social({ provider: 'google', callbackURL: localizeHref(`${base}/account`) })
		loading = false
	}

</script>

<PageTitle title={m.auth_login_title()} />

<AuthShell
	title={m.auth_login_heading()}
	eyebrow={m.auth_login_eyebrow()}
	description={m.auth_login_description()}
>
	<div class="ui-form-status-slot" aria-live="polite">
		{#if errorMessage}
			<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
		{/if}
	</div>

	<form use:validateForm novalidate class="ui-auth-form" onsubmit={signInEmail} aria-busy={loading}>
		<div class="ui-auth-field">
			<label class="ui-field-label" for="login-email"><IconEmail /> {m.auth_email()}</label>
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
				<label class="ui-field-label" for="login-password"><IconLock /> {m.auth_password()}</label>
				<a class="ui-link" href={localizeHref(`${base}/auth/forgot-password`)}>{m.auth_forgot_link()}</a>
			</div>
			<div class="ui-auth-password-wrap" data-ui-validation-host>
				<input
					id="login-password"
					dir="ltr"
					class="ui-input"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					autocomplete="current-password"
					placeholder={m.auth_password()}
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
		</div>

		<button class="ui-btn ui-btn-primary ui-btn-lg ui-btn-block" type="submit" disabled={loading}>
			{#if loading}<span class="ui-spinner"></span>{:else}<IconLogin />{/if}
			<span>{loading ? m.auth_login_loading() : m.auth_login_action()}</span>
		</button>
	</form>

	{#if data.authProviders.google && !isCapacitorBuild}
		<div class="ui-auth-divider"><span>{m.auth_continue_with()}</span></div>
		<div class="ui-auth-socials">
			{#if data.authProviders.google}
				<button
					class="ui-btn ui-btn-outline"
					type="button"
					onclick={signInGoogle}
					disabled={loading}
				>
					<IconLanguage />
					<span>{m.auth_google()}</span>
				</button>
			{/if}
		</div>
	{/if}

	<p class="ui-auth-switch">
		{m.auth_no_account()} <a href={localizeHref(`${base}/auth/register`)}>{m.auth_create_account()}</a>
	</p>
</AuthShell>
