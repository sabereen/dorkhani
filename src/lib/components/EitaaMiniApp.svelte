<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { page } from '$app/state'
	import { serverUrl } from '$lib/config/runtime'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages.js'
	import EitaaWriteAccessModal from './EitaaWriteAccessModal.svelte'
	import Modal from './Modal.svelte'
	import { onMount } from 'svelte'

	type Props = {
		enabled: boolean
	}

	type EitaaAuthResult = {
		status?: 'authenticated' | 'choice-required'
		reason?: 'unlinked' | 'different-account'
		allowsWriteToPm?: boolean
		message?: string
	}

	const eitaaSdkUrl = 'https://developer.eitaa.com/eitaa-web-app.js'
	const provider = 'ایتا'

	function loadEitaaSdk() {
		if (window.Eitaa?.WebApp) return Promise.resolve()

		const existingScript = document.querySelector<HTMLScriptElement>(
			'script[data-eitaa-miniapp-sdk]',
		)
		if (existingScript) {
			return new Promise<void>((resolve, reject) => {
				existingScript.addEventListener('load', () => resolve(), { once: true })
				existingScript.addEventListener(
					'error',
					() => reject(new Error('Eitaa SDK failed to load')),
					{ once: true },
				)
			})
		}

		const script = document.createElement('script')
		script.src = eitaaSdkUrl
		script.async = true
		script.dataset.eitaaMiniappSdk = ''

		return new Promise<void>((resolve, reject) => {
			script.addEventListener('load', () => resolve(), { once: true })
			script.addEventListener('error', () => reject(new Error('Eitaa SDK failed to load')), {
				once: true,
			})
			document.head.appendChild(script)
		})
	}

	const { enabled }: Props = $props()
	let initData = ''
	let open = $state(false)
	let writeAccessOpen = $state(false)
	let loading = $state(false)
	let reason = $state<EitaaAuthResult['reason']>()
	let errorMessage = $state('')

	$effect(() => {
		const backButton = window.Eitaa?.WebApp?.BackButton
		if (!backButton) return
		if (page.url.pathname === `${base}/`) backButton.hide?.()
		else backButton.show?.()
		return () => backButton.hide?.()
	})

	async function authenticate(intent: 'auto' | 'link-current' | 'use-eitaa') {
		const currentInitData = window.Eitaa?.WebApp?.initData
		if (currentInitData) initData = currentInitData
		if (!initData || loading) return
		loading = true
		errorMessage = ''
		try {
			const response = await fetch(serverUrl('/api/auth/sign-in/eitaa', location.origin), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ initData, intent }),
			})
			const result: EitaaAuthResult = await response.json().catch(() => ({}))
			if (!response.ok) {
				errorMessage = result.message || m.miniapp_auto_login_failed({ provider })
				open = true
				return
			}
			if (result.status === 'choice-required') {
				reason = result.reason
				open = true
				return
			}

			open = false
			await claimCreatedKhatms()
			await invalidateAll()
			if (result.allowsWriteToPm === false) writeAccessOpen = true
		} catch {
			errorMessage = m.miniapp_server_error({ provider })
			open = true
		} finally {
			loading = false
		}
	}

	onMount(() => {
		if (!enabled) return
		let cancelled = false
		let cleanup = () => {}

		async function initialize() {
			try {
				await loadEitaaSdk()
			} catch {
				return
			}
			if (cancelled) return

			const webApp = window.Eitaa?.WebApp
			if (!webApp?.initData) return
			initData = webApp.initData
			if (!document.documentElement.dataset.colorScheme && webApp.colorScheme) {
				document.documentElement.dataset.colorScheme = webApp.colorScheme
			}
			webApp.ready?.()
			webApp.expand?.()

			const handleBack = () => {
				if (location.pathname === `${base}/`) return
				history.back()
			}
			const handleSettings = () => void goto(localizeHref(`${base}/settings`))
			webApp.BackButton?.onClick?.(handleBack)
			webApp.SettingsButton?.onClick?.(handleSettings)
			webApp.SettingsButton?.show?.()
			cleanup = () => {
				webApp.BackButton?.offClick?.(handleBack)
				webApp.SettingsButton?.offClick?.(handleSettings)
				webApp.BackButton?.hide?.()
				webApp.SettingsButton?.hide?.()
			}
			void authenticate('auto')
		}

		void initialize()
		return () => {
			cancelled = true
			cleanup()
		}
	})
</script>

<Modal bind:open contentClass="ui-khatm-auth-dialog" labelledBy="eitaa-auth-title">
	<p class="ui-khatm-auth-eyebrow">{m.miniapp_login_eyebrow({ provider })}</p>
	<h2 id="eitaa-auth-title">
		{errorMessage ? m.miniapp_auto_login_failed_title() : m.miniapp_choose_account()}
	</h2>
	{#if errorMessage}
		<div class="ui-alert ui-alert-error mt-3" role="alert">{errorMessage}</div>
		<div class="ui-khatm-auth-actions mt-4">
			<button
				class="ui-btn ui-btn-primary"
				type="button"
				onclick={() => authenticate('auto')}
				disabled={loading}
			>
				{loading ? m.common_loading() : m.common_retry()}
			</button>
			<button class="ui-btn ui-btn-soft" type="button" onclick={() => (open = false)}>
				{m.miniapp_continue_without({ provider })}
			</button>
		</div>
	{:else}
		<p class="ui-khatm-auth-description">
			{reason === 'different-account'
				? m.miniapp_different_account({ provider })
				: m.miniapp_active_session({ provider })}
		</p>
		<div class="ui-khatm-auth-actions">
			{#if reason === 'unlinked'}
				<button
					class="ui-btn ui-btn-primary"
					type="button"
					onclick={() => authenticate('link-current')}
					disabled={loading}
				>
					{m.miniapp_link_current()}
				</button>
			{/if}
			<button
				class="ui-btn ui-btn-outline"
				type="button"
				onclick={() => authenticate('use-eitaa')}
				disabled={loading}
			>
				{reason === 'unlinked'
					? m.miniapp_create_separate({ provider })
					: m.miniapp_sign_in_provider({ provider })}
			</button>
			<button
				class="ui-btn ui-btn-ghost"
				type="button"
				onclick={() => (open = false)}
				disabled={loading}
			>
				{m.miniapp_continue_current()}
			</button>
		</div>
	{/if}
</Modal>

<EitaaWriteAccessModal bind:open={writeAccessOpen} />
