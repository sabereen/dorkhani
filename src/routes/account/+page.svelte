<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { authClient, clearAuthToken } from '$lib/auth-client'
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import type { PageProps } from './$types'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import { apiRequest } from '$lib/utility/request'
	import * as m from '$lib/paraglide/messages.js'

	const { data }: PageProps = $props()
	const khatms = $derived(Khatm.fromPlainList(data.khatms))
	let notificationStatus = $state<'saved' | 'error' | null>(null)
	let notificationError = $state('')
	let notificationSubmitting = $state(false)

	async function signOut() {
		await authClient.signOut().catch(() => undefined)
		await clearAuthToken()
		await invalidateAll()
		await goto(localizeHref(`${base}/`))
	}

	async function saveNotifications(event: SubmitEvent) {
		event.preventDefault()
		notificationSubmitting = true
		notificationStatus = null
		const form = new FormData(event.currentTarget as HTMLFormElement)
		try {
			await apiRequest('PUT', '/account/notifications', {
				origin: location.origin,
				body: {
					enabled: form.get('enabled') === 'on',
					preferredChannel: String(form.get('preferredChannel') || '') || null,
					baleEnabled: form.get('baleEnabled') === 'on',
					eitaaEnabled: form.get('eitaaEnabled') === 'on',
					emailEnabled: form.get('emailEnabled') === 'on',
				},
			})
			notificationStatus = 'saved'
		} catch (cause) {
			notificationError = cause instanceof Error ? cause.message : m.account_notifications_error()
			notificationStatus = 'error'
		} finally {
			notificationSubmitting = false
		}
	}
</script>

<PageTitle title={m.account_title()} />

<Header title={m.account_title()} />

<section class="ui-card ui-card-bordered mt-4">
	<div class="ui-card-body flex-row items-center justify-between">
		<div>
			<h2 class="font-bold">{data.user.name}</h2>
			{#if data.user.email}<p class="text-sm opacity-70">{data.user.email}</p>{/if}
		</div>
		<button class="ui-btn ui-btn-outline" type="button" onclick={signOut}>{m.account_sign_out()}</button>
	</div>
</section>

<section class="ui-card ui-card-bordered mt-4">
	<div class="ui-card-body">
		<h2 class="ui-card-title">{m.account_notifications()}</h2>
		<p class="ui-text-muted">
			{m.account_notifications_description()}
		</p>

		{#if notificationStatus === 'saved'}
			<div class="ui-alert ui-alert-success mt-3" role="status">{m.account_notifications_saved()}</div>
		{:else if notificationStatus === 'error'}
			<div class="ui-alert ui-alert-error mt-3" role="alert">{notificationError}</div>
		{/if}

		<form class="ui-auth-form mt-4" aria-busy={notificationSubmitting} onsubmit={saveNotifications}>
			<label class="ui-field-label">
				<input
					class="ui-checkbox"
					type="checkbox"
					name="enabled"
					checked={data.notificationSettings?.enabled ?? true}
				/>
				<span>{m.account_notifications_enabled()}</span>
			</label>

			<fieldset class="ui-fieldset">
				<legend class="ui-fieldset-legend">{m.account_channels()}</legend>
				<label class="ui-field-label">
					<input
						class="ui-checkbox"
						type="checkbox"
						name="baleEnabled"
						checked={data.notificationSettings?.channels.bale.enabled ?? true}
					/>
					<span>Bale</span>
					{#if data.notificationSettings?.channels.bale.available}
						<span class="ui-badge ui-badge-success">{m.account_ready()}</span>
					{:else if data.messengerLinks.bale}
						<a class="ui-link" href={data.messengerLinks.bale}>{m.account_start_chat()}</a>
					{:else}
						<span class="ui-text-muted">{m.account_unavailable()}</span>
					{/if}
				</label>

				<label class="ui-field-label">
					<input
						class="ui-checkbox"
						type="checkbox"
						name="eitaaEnabled"
						checked={data.notificationSettings?.channels.eitaa.enabled ?? true}
					/>
					<span>Eitaa</span>
					{#if data.notificationSettings?.channels.eitaa.available}
						<span class="ui-badge ui-badge-success">{m.account_ready()}</span>
					{:else if data.messengerLinks.eitaa}
						<a class="ui-link" href={data.messengerLinks.eitaa}>{m.account_start_chat()}</a>
					{:else}
						<span class="ui-text-muted">{m.account_unavailable()}</span>
					{/if}
				</label>

				<label class="ui-field-label">
					<input
						class="ui-checkbox"
						type="checkbox"
						name="emailEnabled"
						checked={data.notificationSettings?.channels.email.enabled ?? true}
					/>
					<span>{m.account_email()}</span>
					<span class="ui-text-muted">
						{data.notificationSettings?.channels.email.available
							? m.account_ready()
							: m.account_email_unavailable()}
					</span>
				</label>
			</fieldset>

			<div class="ui-auth-field">
				<label class="ui-field-label" for="preferred-notification-channel">{m.account_preferred_channel()}</label>
				<select
					id="preferred-notification-channel"
					class="ui-select"
					name="preferredChannel"
					value={data.notificationSettings?.preferredChannel || ''}
				>
					<option value="">{m.account_default_priority()}</option>
					<option value="bale">Bale</option>
					<option value="eitaa">Eitaa</option>
					<option value="email">{m.account_email()}</option>
				</select>
			</div>

			<button class="ui-btn ui-btn-primary" type="submit" disabled={notificationSubmitting}>{m.account_save_notifications()}</button>
		</form>
	</div>
</section>

<section class="mt-6">
	<h2 class="mb-3 text-xl font-black">{m.account_my_khatms()}</h2>
	{#if khatms.length === 0}
		<div class="ui-alert">{m.account_no_khatms()}</div>
	{:else}
		<ul class="ui-khatm-card-list ui-khatm-card-list-grid">
			{#each khatms as khatm (khatm.id)}
				<li>
					<KhatmListCard {khatm} meta={khatm.private ? m.account_private_khatm() : m.account_public_khatm()}>
						{#snippet actions()}
							<a class="ui-btn ui-btn-ghost ui-btn-xs" href={khatm.link}>{m.account_view()}</a>
							<a
								class="ui-btn ui-btn-primary ui-btn-xs"
								href={localizeHref(`${base}/account/khatms/${khatm.id}/edit`)}>{m.account_edit()}</a
							>
						{/snippet}
					</KhatmListCard>
				</li>
			{/each}
		</ul>
	{/if}
</section>
