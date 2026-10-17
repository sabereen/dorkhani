<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import PageTitle from '$lib/components/PageTitle.svelte'
	import KhatmListCard from '$lib/components/KhatmListCard.svelte'
	import EitaaWriteAccessModal from '$lib/components/EitaaWriteAccessModal.svelte'
	import Modal from '$lib/components/Modal.svelte'
	import { Khatm } from '$lib/entity/Khatm.svelte'
	import { formatNumber } from '$lib/i18n/format'
	import { authClient, clearAuthToken } from '$lib/auth-client'
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import type { PageProps } from './$types'
	import type { NotificationChannel } from '$lib/contracts/api'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import { apiRequest } from '$lib/utility/request'
	import IconAccount from '~icons/ic/round-account-circle'
	import IconAdd from '~icons/ic/round-add'
	import IconBook from '~icons/ic/round-menu-book'
	import IconChat from '~icons/ic/round-chat-bubble'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconEmail from '~icons/ic/round-email'
	import IconLogout from '~icons/ic/round-logout'
	import IconNotifications from '~icons/ic/round-notifications-active'
	import IconRefresh from '~icons/ic/round-refresh'
	import IconSave from '~icons/ic/round-save'
	import IconSettings from '~icons/ic/round-settings'
	import * as m from '$lib/paraglide/messages.js'

	type NotificationForm = {
		enabled: boolean
		preferredChannel: NotificationChannel | null
		baleEnabled: boolean
		eitaaEnabled: boolean
		soroushEnabled: boolean
		emailEnabled: boolean
	}

	const { data }: PageProps = $props()
	const khatms = $derived(Khatm.fromPlainList(data.khatms))
	const activeKhatms = $derived(khatms.filter((khatm) => !khatm.finished).length)
	const readyChannelCount = $derived(
		data.notificationSettings
			? Object.values(data.notificationSettings.channels).filter((channel) => channel.available)
					.length
			: 0,
	)
	const profileInitial = $derived(data.user.name.trim().charAt(0) || '•')

	function getInitialNotificationForm(): NotificationForm {
		return {
			enabled: data.notificationSettings?.enabled ?? true,
			preferredChannel: data.notificationSettings?.preferredChannel ?? null,
			baleEnabled: data.notificationSettings?.channels.bale.enabled ?? true,
			eitaaEnabled: data.notificationSettings?.channels.eitaa.enabled ?? true,
			soroushEnabled: data.notificationSettings?.channels.soroush.enabled ?? true,
			emailEnabled: data.notificationSettings?.channels.email.enabled ?? true,
		}
	}

	let notificationForm = $state<NotificationForm>(getInitialNotificationForm())
	let savedNotificationForm = $state(JSON.stringify(getInitialNotificationForm()))
	let notificationStatus = $state<'saved' | 'error' | null>(null)
	let notificationError = $state('')
	let notificationSubmitting = $state(false)
	let eitaaWriteAccessOpen = $state(false)
	let eitaaWriteAccessGranted = $state(false)
	let signOutOpen = $state(false)
	let signOutSubmitting = $state(false)
	const notificationDirty = $derived(JSON.stringify(notificationForm) !== savedNotificationForm)
	const eitaaAvailable = $derived(
		(data.notificationSettings?.channels.eitaa.available ?? false) || eitaaWriteAccessGranted,
	)

	function clearNotificationStatus() {
		notificationStatus = null
		notificationError = ''
	}

	function resetNotifications() {
		notificationForm = JSON.parse(savedNotificationForm) as NotificationForm
		clearNotificationStatus()
	}

	function changeEitaaEnabled(event: Event) {
		const enabled = (event.currentTarget as HTMLInputElement).checked
		clearNotificationStatus()
		if (enabled && !eitaaAvailable) {
			notificationForm.eitaaEnabled = false
			eitaaWriteAccessOpen = true
			return
		}
		notificationForm.eitaaEnabled = enabled
	}

	function handleEitaaWriteAccessGranted() {
		eitaaWriteAccessGranted = true
		notificationForm.eitaaEnabled = true
		clearNotificationStatus()
	}

	async function signOut() {
		signOutSubmitting = true
		await authClient.signOut().catch(() => undefined)
		await clearAuthToken()
		await invalidateAll()
		await goto(localizeHref(`${base}/`))
	}

	async function saveNotifications(event: SubmitEvent) {
		event.preventDefault()
		if (!notificationDirty || notificationSubmitting) return
		const savedForm = JSON.parse(savedNotificationForm) as NotificationForm
		if (notificationForm.eitaaEnabled && !savedForm.eitaaEnabled && !eitaaAvailable) {
			eitaaWriteAccessOpen = true
			return
		}
		notificationSubmitting = true
		clearNotificationStatus()
		try {
			await apiRequest('PUT', '/account/notifications', {
				origin: location.origin,
				body: notificationForm,
			})
			savedNotificationForm = JSON.stringify(notificationForm)
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

<div class="ui-account-page">
	<section class="ui-account-profile" aria-labelledby="account-profile-name">
		<div class="ui-account-profile-identity">
			<div class="ui-account-avatar" aria-hidden="true">
				<span>{profileInitial}</span>
				<IconAccount />
			</div>
			<div class="ui-account-profile-copy">
				<span class="ui-account-eyebrow">{m.account_profile_eyebrow()}</span>
				<h2 id="account-profile-name" dir="auto">{data.user.name}</h2>
				<p dir={data.user.email ? 'ltr' : undefined}>
					{data.user.email || m.account_email_not_set()}
				</p>
			</div>
		</div>

		<div class="ui-account-overview" aria-label={m.account_overview()}>
			<div>
				<span>{m.account_khatms_total()}</span>
				<strong>{formatNumber(khatms.length)}</strong>
			</div>
			<div>
				<span>{m.account_khatms_active()}</span>
				<strong>{formatNumber(activeKhatms)}</strong>
			</div>
			<div>
				<span>{m.account_ready_channels()}</span>
				<strong>{formatNumber(readyChannelCount)}</strong>
			</div>
		</div>

		<div class="ui-account-profile-actions">
			<a class="ui-btn ui-btn-soft ui-btn-sm" href={localizeHref(`${base}/settings`)}>
				<IconSettings /><span>{m.account_app_settings()}</span>
			</a>
			<button
				class="ui-btn ui-btn-ghost ui-btn-sm"
				type="button"
				onclick={() => (signOutOpen = true)}
			>
				<IconLogout /><span>{m.account_sign_out()}</span>
			</button>
		</div>
	</section>

	<section
		class="ui-card ui-card-bordered ui-account-notifications"
		aria-labelledby="notification-heading"
	>
		<div class="ui-card-body">
			<header class="ui-account-section-heading">
				<span class="ui-account-section-icon"><IconNotifications /></span>
				<div>
					<h2 id="notification-heading">{m.account_notifications()}</h2>
					<p>{m.account_notifications_description()}</p>
				</div>
			</header>

			{#if notificationStatus === 'saved'}
				<div class="ui-alert ui-alert-success ui-account-status" role="status">
					<IconCheck />
					<span>{m.account_notifications_saved()}</span>
				</div>
			{:else if notificationStatus === 'error'}
				<div class="ui-alert ui-alert-error ui-account-status" role="alert">
					{notificationError}
				</div>
			{/if}

			<form aria-busy={notificationSubmitting} onsubmit={saveNotifications}>
				<div
					class:ui-account-master-enabled={notificationForm.enabled}
					class="ui-account-master-switch"
				>
					<div>
						<strong>{m.account_notifications_enabled()}</strong>
						<span>{m.account_notifications_master_description()}</span>
					</div>
					<label class="ui-account-switch">
						<span class="ui-sr-only">{m.account_notifications_enabled()}</span>
						<input
							type="checkbox"
							bind:checked={notificationForm.enabled}
							onchange={clearNotificationStatus}
						/>
						<span aria-hidden="true"></span>
					</label>
				</div>

				{#if !notificationForm.enabled}
					<p class="ui-account-disabled-note">{m.account_notifications_disabled_note()}</p>
				{/if}

				<fieldset class="ui-account-channel-fieldset" disabled={!notificationForm.enabled}>
					<legend>{m.account_channels()}</legend>
					<div class="ui-account-channel-grid">
						<article
							class:ui-account-channel-ready={data.notificationSettings?.channels.bale.available}
							class="ui-account-channel"
						>
							<div class="ui-account-channel-heading">
								<span class="ui-account-channel-icon"><IconChat /></span>
								<div>
									<strong>{m.account_bale()}</strong>
									<span
										class:ui-badge-success={data.notificationSettings?.channels.bale.available}
										class="ui-badge ui-badge-xs"
									>
										{data.notificationSettings?.channels.bale.available
											? m.account_ready()
											: m.account_not_connected()}
									</span>
								</div>
							</div>
							<p>
								{data.notificationSettings?.channels.bale.available
									? m.account_channel_ready_description()
									: data.messengerLinks.bale
										? m.account_channel_setup_description()
										: m.account_channel_unavailable_description()}
							</p>
							<div class="ui-account-channel-footer">
								<label>
									<input
										class="ui-checkbox"
										type="checkbox"
										bind:checked={notificationForm.baleEnabled}
										onchange={clearNotificationStatus}
									/>
									<span>{m.account_channel_enabled()}</span>
								</label>
								{#if !data.notificationSettings?.channels.bale.available && data.messengerLinks.bale}
									<a href={data.messengerLinks.bale} target="_blank" rel="noreferrer">
										{m.account_start_chat()}
									</a>
								{/if}
							</div>
						</article>

						<article class:ui-account-channel-ready={eitaaAvailable} class="ui-account-channel">
							<div class="ui-account-channel-heading">
								<span class="ui-account-channel-icon"><IconChat /></span>
								<div>
									<strong>{m.account_eitaa()}</strong>
									<span class:ui-badge-success={eitaaAvailable} class="ui-badge ui-badge-xs">
										{eitaaAvailable ? m.account_ready() : m.account_not_connected()}
									</span>
								</div>
							</div>
							<p>
								{eitaaAvailable
									? m.account_channel_ready_description()
									: m.account_eitaa_permission_description()}
							</p>
							<div class="ui-account-channel-footer">
								<label>
									<input
										class="ui-checkbox"
										type="checkbox"
										checked={notificationForm.eitaaEnabled}
										onchange={changeEitaaEnabled}
									/>
									<span>{m.account_channel_enabled()}</span>
								</label>
								{#if !eitaaAvailable}
									<button
										class="ui-account-channel-connect"
										type="button"
										onclick={() => (eitaaWriteAccessOpen = true)}
									>
										{m.eitaa_write_access_enable()}
									</button>
								{/if}
							</div>
						</article>

						<article
							class:ui-account-channel-ready={data.notificationSettings?.channels.soroush.available}
							class="ui-account-channel"
						>
							<div class="ui-account-channel-heading">
								<span class="ui-account-channel-icon"><IconChat /></span>
								<div>
									<strong>{m.account_soroush()}</strong>
									<span
										class:ui-badge-success={data.notificationSettings?.channels.soroush.available}
										class="ui-badge ui-badge-xs"
									>
										{data.notificationSettings?.channels.soroush.available
											? m.account_ready()
											: m.account_not_connected()}
									</span>
								</div>
							</div>
							<p>
								{data.notificationSettings?.channels.soroush.available
									? m.account_channel_ready_description()
									: data.messengerLinks.soroush
										? m.account_channel_setup_description()
										: m.account_channel_unavailable_description()}
							</p>
							<div class="ui-account-channel-footer">
								<label>
									<input
										class="ui-checkbox"
										type="checkbox"
										bind:checked={notificationForm.soroushEnabled}
										onchange={clearNotificationStatus}
									/>
									<span>{m.account_channel_enabled()}</span>
								</label>
								{#if !data.notificationSettings?.channels.soroush.available && data.messengerLinks.soroush}
									<a href={data.messengerLinks.soroush} target="_blank" rel="noreferrer">
										{m.account_start_chat()}
									</a>
								{/if}
							</div>
						</article>

						<article
							class:ui-account-channel-ready={data.notificationSettings?.channels.email.available}
							class="ui-account-channel"
						>
							<div class="ui-account-channel-heading">
								<span class="ui-account-channel-icon"><IconEmail /></span>
								<div>
									<strong>{m.account_email()}</strong>
									<span
										class:ui-badge-success={data.notificationSettings?.channels.email.available}
										class="ui-badge ui-badge-xs"
									>
										{data.notificationSettings?.channels.email.available
											? m.account_ready()
											: m.account_unavailable()}
									</span>
								</div>
							</div>
							<p>
								{data.notificationSettings?.channels.email.available
									? m.account_email_ready_description()
									: m.account_email_unavailable()}
							</p>
							<div class="ui-account-channel-footer">
								<label>
									<input
										class="ui-checkbox"
										type="checkbox"
										bind:checked={notificationForm.emailEnabled}
										onchange={clearNotificationStatus}
									/>
									<span>{m.account_channel_enabled()}</span>
								</label>
							</div>
						</article>
					</div>
				</fieldset>

				<div class="ui-account-preference">
					<div>
						<label for="preferred-notification-channel">{m.account_preferred_channel()}</label>
						<p>{m.account_preferred_channel_description()}</p>
					</div>
					<select
						id="preferred-notification-channel"
						class="ui-select"
						bind:value={notificationForm.preferredChannel}
						disabled={!notificationForm.enabled}
						onchange={clearNotificationStatus}
					>
						<option value={null}>{m.account_default_priority()}</option>
						<option value="bale" disabled={!data.notificationSettings?.channels.bale.available}>
							{m.account_bale()}
						</option>
						<option value="eitaa" disabled={!eitaaAvailable}>
							{m.account_eitaa()}
						</option>
						<option
							value="soroush"
							disabled={!data.notificationSettings?.channels.soroush.available}
						>
							{m.account_soroush()}
						</option>
						<option value="email" disabled={!data.notificationSettings?.channels.email.available}>
							{m.account_email()}
						</option>
					</select>
				</div>

				<footer class="ui-account-form-actions">
					<div aria-live="polite">
						{#if notificationDirty}<span>{m.account_unsaved_changes()}</span>{/if}
					</div>
					<div>
						<button
							class="ui-btn ui-btn-ghost"
							type="button"
							disabled={!notificationDirty || notificationSubmitting}
							onclick={resetNotifications}
						>
							<IconRefresh />
							<span>{m.account_discard_changes()}</span>
						</button>
						<button
							class="ui-btn ui-btn-primary"
							type="submit"
							disabled={!notificationDirty || notificationSubmitting}
						>
							{#if notificationSubmitting}<span class="ui-spinner" aria-hidden="true"
								></span>{:else}<IconSave />{/if}
							<span
								>{notificationSubmitting
									? m.account_saving()
									: m.account_save_notifications()}</span
							>
						</button>
					</div>
				</footer>
			</form>
		</div>
	</section>

	<section class="ui-account-khatms" aria-labelledby="ui-account-khatms-heading">
		<header class="ui-account-khatms-heading">
			<div>
				<span class="ui-account-section-icon"><IconBook /></span>
				<div>
					<h2 id="ui-account-khatms-heading">{m.account_my_khatms()}</h2>
					<p>{m.account_khatms_description()}</p>
				</div>
			</div>
			<a class="ui-btn ui-btn-primary ui-btn-sm" href={localizeHref(`${base}/add`)}>
				<IconAdd />
				<span>{m.account_create_khatm()}</span>
			</a>
		</header>

		{#if khatms.length === 0}
			<div class="ui-account-empty">
				<span><IconBook /></span>
				<h3>{m.account_no_khatms()}</h3>
				<p>{m.account_no_khatms_description()}</p>
				<a class="ui-btn ui-btn-primary" href={localizeHref(`${base}/add`)}>
					<IconAdd />
					<span>{m.account_create_first_khatm()}</span>
				</a>
			</div>
		{:else}
			<ul class="ui-khatm-card-list ui-khatm-card-list-grid">
				{#each khatms as khatm (khatm.id)}
					<li>
						<KhatmListCard
							{khatm}
							meta={khatm.private ? m.account_private_khatm() : m.account_public_khatm()}
						>
							{#snippet actions()}
								<a class="ui-btn ui-btn-ghost ui-btn-xs" href={khatm.link}>{m.account_view()}</a>
								<a
									class="ui-btn ui-btn-primary ui-btn-xs"
									href={localizeHref(`${base}/account/khatms/${khatm.id}/edit`)}
								>
									{m.account_edit()}
								</a>
							{/snippet}
						</KhatmListCard>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<EitaaWriteAccessModal bind:open={eitaaWriteAccessOpen} onGranted={handleEitaaWriteAccessGranted} />

<Modal
	bind:open={signOutOpen}
	contentClass="ui-account-sign-out-dialog"
	labelledBy="account-sign-out-heading"
	closeOnBackdrop={!signOutSubmitting}
	closeOnEscape={!signOutSubmitting}
>
	<div class="ui-account-sign-out-icon"><IconLogout /></div>
	<h2 id="account-sign-out-heading">{m.account_sign_out_confirm_title()}</h2>
	<p>{m.account_sign_out_confirm_description()}</p>
	<div class="ui-account-sign-out-actions">
		<button
			class="ui-btn ui-btn-ghost"
			type="button"
			disabled={signOutSubmitting}
			onclick={() => (signOutOpen = false)}
		>
			{m.account_cancel()}
		</button>
		<button
			class="ui-btn ui-btn-danger"
			type="button"
			disabled={signOutSubmitting}
			onclick={signOut}
		>
			{#if signOutSubmitting}
				<span class="ui-spinner" aria-hidden="true"></span>
			{:else}
				<IconLogout />
			{/if}
			<span>{signOutSubmitting ? m.account_signing_out() : m.account_sign_out()}</span>
		</button>
	</div>
</Modal>
