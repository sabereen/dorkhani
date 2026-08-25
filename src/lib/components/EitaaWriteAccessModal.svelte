<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { serverUrl } from '$lib/config/runtime'
	import * as m from '$lib/paraglide/messages.js'
	import IconBook from '~icons/ic/round-menu-book'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconNotifications from '~icons/ic/round-notifications-active'
	import IconShield from '~icons/ic/round-shield'
	import Modal from './Modal.svelte'

	type WriteAccessState =
		| 'idle'
		| 'requesting'
		| 'granted'
		| 'denied'
		| 'unsupported'
		| 'error'

	type Props = {
		open?: boolean
		onGranted?: () => void | Promise<void>
	}

	let { open = $bindable(false), onGranted }: Props = $props()
	let state = $state<WriteAccessState>('idle')
	let wasOpen = false

	$effect(() => {
		if (open && !wasOpen) state = 'idle'
		wasOpen = open
	})

	function requestWriteAccess() {
		if (state === 'requesting') return
		const webApp = window.Eitaa?.WebApp
		if (!webApp?.requestWriteAccess) {
			state = 'unsupported'
			return
		}

		state = 'requesting'
		try {
			webApp.requestWriteAccess(async (granted) => {
				if (!granted) {
					state = 'denied'
					return
				}

				try {
					const response = await fetch(
						serverUrl('/api/account/notifications/eitaa', location.origin),
						{ method: 'POST' },
					)
					if (!response.ok) throw new Error('Failed to save Eitaa write access')
					await invalidateAll()
					await onGranted?.()
					state = 'granted'
				} catch {
					state = 'error'
				}
			})
		} catch {
			state = 'error'
		}
	}
</script>

<Modal
	bind:open
	contentClass="ui-khatm-auth-dialog ui-eitaa-permission-dialog"
	labelledBy="eitaa-permission-title"
	closeOnBackdrop={state !== 'requesting'}
	closeOnEscape={state !== 'requesting'}
>
	<div class="ui-khatm-auth-icon ui-eitaa-permission-icon" aria-hidden="true">
		<IconNotifications />
	</div>
	<p class="ui-khatm-auth-eyebrow">{m.eitaa_write_access_eyebrow()}</p>
	<h2 id="eitaa-permission-title">{m.eitaa_write_access_title()}</h2>
	<p class="ui-khatm-auth-description">{m.eitaa_write_access_description()}</p>

	<ul class="ui-eitaa-permission-list">
		<li>
			<span class="ui-eitaa-permission-marker" aria-hidden="true"><IconCheck /></span>
			<span>{m.eitaa_write_access_created()}</span>
		</li>
		<li>
			<span class="ui-eitaa-permission-marker" aria-hidden="true"><IconBook /></span>
			<span>{m.eitaa_write_access_participation()}</span>
		</li>
		<li>
			<span class="ui-eitaa-permission-marker" aria-hidden="true"><IconNotifications /></span>
			<span>{m.eitaa_write_access_completed()}</span>
		</li>
	</ul>

	<div class="ui-eitaa-permission-note">
		<IconShield aria-hidden="true" />
		<span>{m.eitaa_write_access_privacy()}</span>
	</div>

	{#if state === 'granted'}
		<div class="ui-alert ui-alert-success mt-3" role="status">
			<IconCheck aria-hidden="true" />
			<span>{m.eitaa_write_access_granted()}</span>
		</div>
	{:else if state === 'denied'}
		<div class="ui-alert ui-alert-info mt-3" role="status">
			{m.eitaa_write_access_denied()}
		</div>
	{:else if state === 'unsupported'}
		<div class="ui-alert ui-alert-info mt-3" role="status">
			{m.eitaa_write_access_unsupported()}
		</div>
	{:else if state === 'error'}
		<div class="ui-alert ui-alert-error mt-3" role="alert">
			{m.eitaa_write_access_error()}
		</div>
	{/if}

	<div class="ui-eitaa-permission-actions">
		{#if state === 'granted'}
			<button class="ui-btn ui-btn-primary" type="button" onclick={() => (open = false)}>
				{m.eitaa_write_access_continue()}
			</button>
		{:else}
			<button
				class="ui-btn ui-btn-primary"
				type="button"
				onclick={requestWriteAccess}
				disabled={state === 'requesting'}
			>
				{#if state === 'requesting'}
					<span class="ui-spinner" aria-hidden="true"></span>
					<span>{m.eitaa_write_access_requesting()}</span>
				{:else}
					<IconNotifications aria-hidden="true" />
					<span>{m.eitaa_write_access_enable()}</span>
				{/if}
			</button>
			<button
				class="ui-btn ui-btn-ghost"
				type="button"
				onclick={() => (open = false)}
				disabled={state === 'requesting'}
			>
				{m.eitaa_write_access_later()}
			</button>
		{/if}
	</div>
</Modal>
