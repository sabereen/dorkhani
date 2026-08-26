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
		emailEnabled: boolean
	}

	const { data }: PageProps = $props()
	const khatms = $derived(Khatm.fromPlainList(data.khatms))
	const activeKhatms = $derived(khatms.filter((khatm) => !khatm.finished).length)
	const readyChannelCount = $derived(
		data.notificationSettings
			? Object.values(data.notificationSettings.channels).filter(
					(channel) => channel.available,
				).length
			: 0,
	)
	const profileInitial = $derived(data.user.name.trim().charAt(0) || '•')

	function getInitialNotificationForm(): NotificationForm {
		return {
			enabled: data.notificationSettings?.enabled ?? true,
			preferredChannel: data.notificationSettings?.preferredChannel ?? null,
			baleEnabled: data.notificationSettings?.channels.bale.enabled ?? true,
			eitaaEnabled: data.notificationSettings?.channels.eitaa.enabled ?? true,
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
			notificationError =
				cause instanceof Error ? cause.message : m.account_notifications_error()
			notificationStatus = 'error'
		} finally {
			notificationSubmitting = false
		}
	}
</script>

<PageTitle title={m.account_title()} />
<Header title={m.account_title()} />

<div class="account-page">
	<section class="account-profile" aria-labelledby="account-profile-name">
		<div class="account-profile-identity">
			<div class="account-avatar" aria-hidden="true">
				<span>{profileInitial}</span>
				<IconAccount />
			</div>
			<div class="account-profile-copy">
				<span class="account-eyebrow">{m.account_profile_eyebrow()}</span>
				<h2 id="account-profile-name" dir="auto">{data.user.name}</h2>
				<p dir={data.user.email ? 'ltr' : undefined}>
					{data.user.email || m.account_email_not_set()}
				</p>
			</div>
		</div>

		<div class="account-overview" aria-label={m.account_overview()}>
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

		<div class="account-profile-actions">
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
		class="ui-card ui-card-bordered account-notifications"
		aria-labelledby="notification-heading"
	>
		<div class="ui-card-body">
			<header class="account-section-heading">
				<span class="account-section-icon"><IconNotifications /></span>
				<div>
					<h2 id="notification-heading">{m.account_notifications()}</h2>
					<p>{m.account_notifications_description()}</p>
				</div>
			</header>

			{#if notificationStatus === 'saved'}
				<div class="ui-alert ui-alert-success account-status" role="status">
					<IconCheck />
					<span>{m.account_notifications_saved()}</span>
				</div>
			{:else if notificationStatus === 'error'}
				<div class="ui-alert ui-alert-error account-status" role="alert">{notificationError}</div>
			{/if}

			<form aria-busy={notificationSubmitting} onsubmit={saveNotifications}>
				<div
					class:account-master-enabled={notificationForm.enabled}
					class="account-master-switch"
				>
					<div>
						<strong>{m.account_notifications_enabled()}</strong>
						<span>{m.account_notifications_master_description()}</span>
					</div>
					<label class="account-switch">
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
					<p class="account-disabled-note">{m.account_notifications_disabled_note()}</p>
				{/if}

				<fieldset class="account-channel-fieldset" disabled={!notificationForm.enabled}>
					<legend>{m.account_channels()}</legend>
					<div class="account-channel-grid">
						<article
							class:account-channel-ready={data.notificationSettings?.channels.bale.available}
							class="account-channel"
						>
							<div class="account-channel-heading">
								<span class="account-channel-icon"><IconChat /></span>
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
							<div class="account-channel-footer">
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

						<article
							class:account-channel-ready={eitaaAvailable}
							class="account-channel"
						>
							<div class="account-channel-heading">
								<span class="account-channel-icon"><IconChat /></span>
								<div>
									<strong>{m.account_eitaa()}</strong>
									<span
										class:ui-badge-success={eitaaAvailable}
										class="ui-badge ui-badge-xs"
									>
										{eitaaAvailable
											? m.account_ready()
											: m.account_not_connected()}
									</span>
								</div>
							</div>
							<p>
								{eitaaAvailable
									? m.account_channel_ready_description()
									: m.account_eitaa_permission_description()}
							</p>
							<div class="account-channel-footer">
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
										class="account-channel-connect"
										type="button"
										onclick={() => (eitaaWriteAccessOpen = true)}
									>
										{m.eitaa_write_access_enable()}
									</button>
								{/if}
							</div>
						</article>

						<article
							class:account-channel-ready={data.notificationSettings?.channels.email.available}
							class="account-channel"
						>
							<div class="account-channel-heading">
								<span class="account-channel-icon"><IconEmail /></span>
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
							<div class="account-channel-footer">
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

				<div class="account-preference">
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
						<option
							value="bale"
							disabled={!data.notificationSettings?.channels.bale.available}
						>
							{m.account_bale()}
						</option>
						<option
							value="eitaa"
							disabled={!eitaaAvailable}
						>
							{m.account_eitaa()}
						</option>
						<option
							value="email"
							disabled={!data.notificationSettings?.channels.email.available}
						>
							{m.account_email()}
						</option>
					</select>
				</div>

				<footer class="account-form-actions">
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
							{#if notificationSubmitting}<span class="ui-spinner" aria-hidden="true"></span>{:else}<IconSave />{/if}
							<span>{notificationSubmitting ? m.account_saving() : m.account_save_notifications()}</span>
						</button>
					</div>
				</footer>
			</form>
		</div>
	</section>

	<section class="account-khatms" aria-labelledby="account-khatms-heading">
		<header class="account-khatms-heading">
			<div>
				<span class="account-section-icon"><IconBook /></span>
				<div>
					<h2 id="account-khatms-heading">{m.account_my_khatms()}</h2>
					<p>{m.account_khatms_description()}</p>
				</div>
			</div>
			<a class="ui-btn ui-btn-primary ui-btn-sm" href={localizeHref(`${base}/add`)}>
				<IconAdd />
				<span>{m.account_create_khatm()}</span>
			</a>
		</header>

		{#if khatms.length === 0}
			<div class="account-empty">
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

<EitaaWriteAccessModal
	bind:open={eitaaWriteAccessOpen}
	onGranted={handleEitaaWriteAccessGranted}
/>

<Modal
	bind:open={signOutOpen}
	contentClass="account-sign-out-dialog"
	labelledBy="account-sign-out-heading"
	closeOnBackdrop={!signOutSubmitting}
	closeOnEscape={!signOutSubmitting}
>
	<div class="account-sign-out-icon"><IconLogout /></div>
	<h2 id="account-sign-out-heading">{m.account_sign_out_confirm_title()}</h2>
	<p>{m.account_sign_out_confirm_description()}</p>
	<div class="account-sign-out-actions">
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

<style>
	.account-page {
		padding-top: 1rem;
	}
	.account-page > * + * {
		margin-top: 1rem;
	}
	.account-profile {
		position: relative;
		display: grid;
		grid-template-columns: minmax(14rem, 1fr) auto auto;
		grid-gap: 1.5rem;
		align-items: center;
		padding: 1.35rem;
		border: 1px solid var(--ui-color-border);
		border-radius: var(--ui-radius-xl);
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-md);
		overflow: hidden;
	}
	.account-profile:before {
		position: absolute;
		top: 0;
		right: 0;
		inset-inline-start: 0;
		width: 0.3rem;
		height: 100%;
		background: var(--ui-color-accent);
		content: '';
	}
	.account-profile-identity,
	.account-profile-actions,
	.account-section-heading,
	.account-channel-heading,
	.account-channel-footer,
	.account-channel-footer label,
	.account-form-actions,
	.account-form-actions > div,
	.account-khatms-heading,
	.account-khatms-heading > div,
	.account-sign-out-actions {
		display: flex;
		align-items: center;
	}
	.account-avatar {
		position: relative;
		display: flex;
		width: 4.5rem;
		height: 4.5rem;
		flex: 0 0 4.5rem;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--ui-color-primary);
		border-radius: 1.35rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
		box-shadow: 0 0 0 0.35rem var(--ui-color-primary-softer);
	}
	.account-avatar span {
		font-size: 1.8rem;
		font-weight: 950;
	}
	.account-avatar :global(svg) {
		position: absolute;
		right: -0.2rem;
		bottom: -0.2rem;
		width: 1.35rem;
		height: 1.35rem;
		border: 2px solid var(--ui-color-surface-raised);
		border-radius: 9999px;
		background: var(--ui-color-surface-raised);
	}
	[dir='rtl'] .account-avatar :global(svg) {
		right: auto;
		left: -0.2rem;
	}
	.account-profile-copy {
		min-width: 0;
		margin-inline-start: 1rem;
	}
	.account-eyebrow {
		color: var(--ui-color-primary);
		font-size: 0.7rem;
		font-weight: 900;
	}
	.account-profile-copy h2,
	.account-profile-copy p,
	.account-section-heading h2,
	.account-section-heading p,
	.account-khatms-heading h2,
	.account-khatms-heading p,
	.account-channel p,
	.account-preference p,
	.account-empty h3,
	.account-empty p {
		margin: 0;
	}
	.account-profile-copy h2 {
		margin-top: 0.15rem;
		font-size: 1.35rem;
		font-weight: 950;
		line-height: 1.6;
	}
	.account-profile-copy p {
		margin-top: 0.1rem;
		color: var(--ui-color-text-muted);
		font-size: 0.75rem;
		text-align: start;
		word-break: break-word;
	}
	.account-overview {
		display: grid;
		grid-template-columns: repeat(3, minmax(4.5rem, 1fr));
		grid-gap: 0.4rem;
		padding: 0.4rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-surface-muted);
	}
	.account-overview > div {
		min-width: 4.5rem;
		padding: 0.5rem 0.65rem;
		text-align: center;
	}
	.account-overview > div + div {
		border-inline-start: 1px solid var(--ui-color-border);
	}
	.account-overview span,
	.account-overview strong {
		display: block;
	}
	.account-overview span {
		color: var(--ui-color-text-muted);
		font-size: 0.62rem;
		font-weight: 700;
		white-space: nowrap;
	}
	.account-overview strong {
		margin-top: 0.2rem;
		font-size: 1.15rem;
		font-weight: 950;
	}
	.account-profile-actions {
		flex-direction: column;
		align-items: stretch;
	}
	.account-profile-actions > * + * {
		margin-top: 0.4rem;
	}
	.account-profile-actions :global(svg),
	.account-khatms-heading .ui-btn :global(svg),
	.account-form-actions .ui-btn :global(svg),
	.account-sign-out-actions .ui-btn :global(svg) {
		width: 1.05rem;
		height: 1.05rem;
	}
	.account-notifications {
		border-radius: var(--ui-radius-xl);
		box-shadow: var(--ui-shadow-md);
	}
	.account-notifications > :global(.ui-card-body) {
		padding: 1.35rem;
	}
	.account-section-heading {
		align-items: flex-start;
	}
	.account-section-icon {
		display: flex;
		width: 2.8rem;
		height: 2.8rem;
		flex: 0 0 2.8rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.9rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}
	.account-section-icon :global(svg) {
		width: 1.4rem;
		height: 1.4rem;
	}
	.account-section-heading > div,
	.account-khatms-heading > div > div {
		min-width: 0;
		margin-inline-start: 0.8rem;
	}
	.account-section-heading h2,
	.account-khatms-heading h2 {
		font-size: 1.05rem;
		font-weight: 950;
	}
	.account-section-heading p,
	.account-khatms-heading p {
		margin-top: 0.2rem;
		color: var(--ui-color-text-muted);
		font-size: 0.72rem;
		line-height: 1.8;
	}
	.account-status,
	.account-notifications form {
		margin-top: 1rem;
	}
	.account-status :global(svg) {
		width: 1.2rem;
		height: 1.2rem;
		flex: 0 0 1.2rem;
	}
	.account-notifications form > * + * {
		margin-top: 1rem;
	}
	.account-master-switch {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-surface-muted);
		transition: border-color 160ms ease, background-color 160ms ease;
	}
	.account-master-switch.account-master-enabled {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary-softer);
	}
	.account-master-switch > div {
		min-width: 0;
		padding-inline-end: 1rem;
	}
	.account-master-switch strong,
	.account-master-switch span {
		display: block;
	}
	.account-master-switch strong {
		font-size: 0.85rem;
		font-weight: 900;
	}
	.account-master-switch > div span {
		margin-top: 0.2rem;
		color: var(--ui-color-text-muted);
		font-size: 0.68rem;
		line-height: 1.7;
	}
	.account-switch {
		position: relative;
		display: block;
		width: 3rem;
		height: 1.7rem;
		flex: 0 0 3rem;
		cursor: pointer;
	}
	.account-switch input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
	}
	.account-switch > span:last-child {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		border: 1px solid var(--ui-color-control-border);
		border-radius: 9999px;
		background: var(--ui-color-surface-strong);
		transition: background-color 160ms ease;
	}
	.account-switch > span:last-child:after {
		position: absolute;
		top: 0.2rem;
		right: 0.2rem;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 9999px;
		background: var(--ui-color-surface-raised);
		box-shadow: var(--ui-shadow-sm);
		content: '';
		transition: transform 160ms ease;
	}
	[dir='ltr'] .account-switch > span:last-child:after {
		right: auto;
		left: 0.2rem;
	}
	.account-switch input:checked + span {
		border-color: var(--ui-color-primary);
		background: var(--ui-color-primary);
	}
	[dir='rtl'] .account-switch input:checked + span:after {
		transform: translateX(-1.3rem);
	}
	[dir='ltr'] .account-switch input:checked + span:after {
		transform: translateX(1.3rem);
	}
	.account-switch input:focus + span {
		outline: 3px solid var(--ui-color-focus);
		outline-offset: 2px;
	}
	.account-disabled-note {
		padding: 0.65rem 0.8rem;
		border-inline-start: 3px solid var(--ui-color-warning);
		border-radius: 0.6rem;
		background: var(--ui-color-warning-soft);
		color: var(--ui-color-warning);
		font-size: 0.7rem;
		line-height: 1.8;
	}
	.account-channel-fieldset {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}
	.account-channel-fieldset > legend {
		margin-bottom: 0.55rem;
		font-size: 0.75rem;
		font-weight: 900;
	}
	.account-channel-fieldset:disabled {
		opacity: 0.55;
	}
	.account-channel-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-gap: 0.7rem;
	}
	.account-channel {
		display: flex;
		min-width: 0;
		min-height: 10rem;
		flex-direction: column;
		padding: 0.85rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-surface);
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}
	.account-channel.account-channel-ready {
		border-color: var(--ui-color-success);
	}
	.account-channel:hover {
		box-shadow: var(--ui-shadow-md);
	}
	.account-channel-heading > div {
		min-width: 0;
		margin-inline-start: 0.6rem;
	}
	.account-channel-heading strong {
		display: block;
		font-size: 0.82rem;
		font-weight: 900;
	}
	.account-channel-heading .ui-badge {
		margin-top: 0.2rem;
	}
	.account-channel-icon {
		display: flex;
		width: 2.4rem;
		height: 2.4rem;
		flex: 0 0 2.4rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}
	.account-channel-ready .account-channel-icon {
		background: var(--ui-color-success-soft);
		color: var(--ui-color-success);
	}
	.account-channel-icon :global(svg) {
		width: 1.2rem;
		height: 1.2rem;
	}
	.account-channel > p {
		flex: 1 1 auto;
		margin-top: 0.7rem;
		color: var(--ui-color-text-muted);
		font-size: 0.66rem;
		line-height: 1.75;
	}
	.account-channel-footer {
		min-height: 1.8rem;
		justify-content: space-between;
		margin-top: 0.7rem;
		padding-top: 0.65rem;
		border-top: 1px dashed var(--ui-color-border);
	}
	.account-channel-footer label {
		color: var(--ui-color-text-soft);
		font-size: 0.68rem;
		font-weight: 800;
		cursor: pointer;
	}
	.account-channel-footer label span,
	.account-channel-footer a,
	.account-channel-connect {
		margin-inline-start: 0.4rem;
	}
	.account-channel-footer .ui-checkbox {
		width: 1.15rem;
		height: 1.15rem;
		flex-basis: 1.15rem;
	}
	.account-channel-footer .ui-checkbox:checked:after {
		top: 0.1rem;
		right: 0.32rem;
	}
	.account-channel-footer a,
	.account-channel-connect {
		position: relative;
		z-index: 1;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--ui-color-primary);
		font-size: 0.67rem;
		font-weight: 900;
		text-decoration: none;
		cursor: pointer;
	}
	.account-channel-footer a:hover,
	.account-channel-connect:hover {
		text-decoration: underline;
	}
	.account-preference {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.75fr);
		grid-gap: 1rem;
		align-items: center;
		padding: 0.9rem 1rem;
		border: 1px solid var(--ui-color-border);
		border-radius: 1rem;
		background: var(--ui-color-surface-muted);
	}
	.account-preference label {
		font-size: 0.78rem;
		font-weight: 900;
	}
	.account-preference p {
		margin-top: 0.15rem;
		color: var(--ui-color-text-muted);
		font-size: 0.65rem;
		line-height: 1.7;
	}
	.account-preference .ui-select {
		height: 2.65rem;
	}
	.account-form-actions {
		justify-content: space-between;
		padding-top: 1rem;
		border-top: 1px solid var(--ui-color-border);
	}
	.account-form-actions > div:first-child {
		min-height: 1.5rem;
		color: var(--ui-color-accent);
		font-size: 0.68rem;
		font-weight: 900;
	}
	.account-form-actions > div:last-child > * + * {
		margin-inline-start: 0.5rem;
	}
	.account-form-actions .ui-spinner,
	.account-sign-out-actions .ui-spinner {
		width: 1rem;
		height: 1rem;
		border-top-color: currentColor;
	}
	.account-khatms {
		padding: 1rem;
		border: 1px solid var(--ui-color-border);
		border-radius: var(--ui-radius-xl);
		background: var(--ui-color-surface-muted);
		box-shadow: var(--ui-shadow-sm);
	}
	.account-khatms-heading {
		justify-content: space-between;
		padding: 0.1rem 0.15rem 0.9rem;
	}
	.account-khatms-heading > div {
		min-width: 0;
	}
	.account-khatms > :global(.ui-khatm-card-list) {
		grid-gap: 0.7rem;
	}
	.account-empty {
		padding: 2.5rem 1rem;
		border: 1px dashed var(--ui-color-border-strong);
		border-radius: 1.1rem;
		background: var(--ui-color-surface);
		text-align: center;
	}
	.account-empty > span,
	.account-sign-out-icon {
		display: flex;
		width: 3.6rem;
		height: 3.6rem;
		align-items: center;
		justify-content: center;
		margin: 0 auto 0.8rem;
		border-radius: 1.1rem;
		background: var(--ui-color-primary-soft);
		color: var(--ui-color-primary);
	}
	.account-empty > span :global(svg),
	.account-sign-out-icon :global(svg) {
		width: 1.8rem;
		height: 1.8rem;
	}
	.account-empty h3 {
		font-size: 1rem;
		font-weight: 950;
	}
	.account-empty p {
		max-width: 27rem;
		margin: 0.3rem auto 1rem;
		color: var(--ui-color-text-muted);
		font-size: 0.72rem;
		line-height: 1.8;
	}
	:global(.account-sign-out-dialog) {
		max-width: 27rem;
		text-align: center;
	}
	.account-sign-out-icon {
		background: var(--ui-color-danger-soft);
		color: var(--ui-color-danger);
	}
	.account-sign-out-icon + h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 950;
	}
	.account-sign-out-icon ~ p {
		margin: 0.4rem 0 0;
		color: var(--ui-color-text-muted);
		font-size: 0.78rem;
		line-height: 1.8;
	}
	.account-sign-out-actions {
		justify-content: center;
		margin-top: 1.2rem;
	}
	.account-sign-out-actions > * + * {
		margin-inline-start: 0.5rem;
	}
	@media (max-width: 1023px) {
		.account-profile {
			grid-template-columns: minmax(0, 1fr) auto;
		}
		.account-overview {
			grid-column-end: span 2;
			grid-row: 2;
		}
		.account-channel-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.account-channel:last-child {
			grid-column-end: span 2;
		}
	}
	@media (max-width: 639px) {
		.account-page {
			padding-top: 0.75rem;
		}
		.account-profile {
			grid-template-columns: minmax(0, 1fr);
			grid-gap: 1rem;
			padding: 1rem;
		}
		.account-avatar {
			width: 3.8rem;
			height: 3.8rem;
			flex-basis: 3.8rem;
		}
		.account-avatar span {
			font-size: 1.5rem;
		}
		.account-profile-copy h2 {
			font-size: 1.15rem;
		}
		.account-overview {
			grid-column-end: auto;
			grid-row: auto;
		}
		.account-overview > div {
			padding-inline-start: 0.25rem;
			padding-inline-end: 0.25rem;
		}
		.account-overview span {
			font-size: 0.58rem;
		}
		.account-profile-actions {
			flex-direction: row;
		}
		.account-profile-actions > * {
			flex: 1 1 50%;
		}
		.account-profile-actions > * + * {
			margin-top: 0;
			margin-inline-start: 0.4rem;
		}
		.account-notifications > :global(.ui-card-body) {
			padding: 1rem;
		}
		.account-channel-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.account-channel:last-child {
			grid-column-end: auto;
		}
		.account-preference {
			grid-template-columns: minmax(0, 1fr);
			grid-gap: 0.65rem;
		}
		.account-form-actions {
			align-items: stretch;
			flex-direction: column;
		}
		.account-form-actions > div:last-child {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-gap: 0.5rem;
		}
		.account-form-actions > div:last-child > * + * {
			margin-inline-start: 0;
		}
		.account-form-actions .ui-btn {
			padding-inline-start: 0.6rem;
			padding-inline-end: 0.6rem;
			font-size: 0.7rem;
		}
		.account-khatms {
			padding: 0.75rem;
		}
		.account-khatms-heading {
			align-items: flex-start;
			flex-direction: column;
		}
		.account-khatms-heading > .ui-btn {
			width: 100%;
			margin-top: 0.75rem;
		}
	}
	@media (max-width: 379px) {
		.account-profile-actions {
			flex-direction: column;
		}
		.account-form-actions > div:last-child {
			grid-template-columns: minmax(0, 1fr);
		}
		.account-profile-actions > * + * {
			margin-top: 0.4rem;
			margin-inline-start: 0;
		}
	}
</style>
