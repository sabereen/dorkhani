<script lang="ts">
	import { base } from '$app/paths'
	import { publicWebUrl } from '$lib/config/runtime'
	import { authClient } from '$lib/auth-client'
	import { validateForm } from '$lib/actions/validateForm'
	import AuthShell from '$lib/components/AuthShell.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import IconArrow from '~icons/ic/round-arrow-forward'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconEmail from '~icons/ic/round-email'
	import IconSend from '~icons/ic/round-send'
	import * as m from '$lib/paraglide/messages.js'

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
			redirectTo: publicWebUrl(localizeHref(`${base}/auth/reset-password`)),
		})
		loading = false
		if (result.error) errorMessage = result.error.message || m.auth_email_failed()
		else sent = true
	}
</script>

<PageTitle title={m.auth_forgot_title()} />

<AuthShell
	title={m.auth_forgot_title()}
	eyebrow={m.auth_forgot_eyebrow()}
	description={m.auth_forgot_description()}
>
	{#if sent}
		<div class="ui-auth-success" role="status">
			<span class="ui-auth-success-icon"><IconCheck /></span>
			<h3>{m.auth_recovery_sent_title()}</h3>
			<p>{m.auth_recovery_sent_text()}</p>
			<a class="ui-btn ui-btn-primary ui-btn-block" href={localizeHref(`${base}/auth/login`)}
				>{m.auth_back_to_login()}</a
			>
		</div>
	{:else}
		<div class="ui-form-status-slot" aria-live="polite">
			{#if errorMessage}
				<div class="ui-alert ui-alert-error ui-auth-alert" role="alert">{errorMessage}</div>
			{/if}
		</div>

		<form use:validateForm novalidate class="ui-auth-form" onsubmit={submit} aria-busy={loading}>
			<div class="ui-auth-field">
				<label class="ui-field-label" for="recovery-email"
					><IconEmail /> {m.auth_account_email()}</label
				>
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
				<span>{loading ? m.auth_sending() : m.auth_send_recovery()}</span>
			</button>
		</form>

		<p class="ui-auth-switch">
			<a href={localizeHref(`${base}/auth/login`)}
				><IconArrow class="ltr:mirror" /> {m.auth_back_to_login()}</a
			>
		</p>
	{/if}
</AuthShell>
