<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import { page } from '$app/state'
	import { base } from '$app/paths'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import Modal from './Modal.svelte'
	import { onMount } from 'svelte'

	type Props = {
		enabled: boolean
	}

	type EitaaAuthResult = {
		status?: 'authenticated' | 'choice-required'
		reason?: 'unlinked' | 'different-account'
		message?: string
	}

	const eitaaSdkUrl = 'https://developer.eitaa.com/eitaa-web-app.js'

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
			const response = await fetch(`${base}/api/auth/sign-in/eitaa`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ initData, intent }),
			})
			const result: EitaaAuthResult = await response.json().catch(() => ({}))
			if (!response.ok) {
				errorMessage = result.message || 'ورود خودکار با ایتا ناموفق بود.'
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
		} catch {
			errorMessage = 'ارتباط با سرور برای ورود ایتا برقرار نشد.'
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
			const handleSettings = () => void goto(`${base}/settings`)
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

<Modal bind:open contentClass="ui-khatm-auth-dialog">
	<p class="ui-khatm-auth-eyebrow">ورود از ایتا</p>
	<h2>{errorMessage ? 'ورود خودکار انجام نشد' : 'انتخاب حساب'}</h2>
	{#if errorMessage}
		<div class="ui-alert ui-alert-error mt-3" role="alert">{errorMessage}</div>
		<div class="ui-khatm-auth-actions mt-4">
			<button
				class="ui-btn ui-btn-primary"
				type="button"
				onclick={() => authenticate('auto')}
				disabled={loading}
			>
				{loading ? 'در حال تلاش…' : 'تلاش دوباره'}
			</button>
			<button class="ui-btn ui-btn-soft" type="button" onclick={() => (open = false)}>
				ادامه بدون ورود ایتا
			</button>
		</div>
	{:else}
		<p class="ui-khatm-auth-description">
			{reason === 'different-account'
				? 'حساب ایتا به حساب دیگری متصل است. می‌توانید نشست فعلی را نگه دارید یا وارد حساب ایتا شوید.'
				: 'یک نشست فعال دارید. حساب ایتا را به همین نشست متصل کنید یا برای آن حساب جداگانه‌ای بسازید.'}
		</p>
		<div class="ui-khatm-auth-actions">
			{#if reason === 'unlinked'}
				<button
					class="ui-btn ui-btn-primary"
					type="button"
					onclick={() => authenticate('link-current')}
					disabled={loading}
				>
					اتصال به حساب فعلی
				</button>
			{/if}
			<button
				class="ui-btn ui-btn-outline"
				type="button"
				onclick={() => authenticate('use-eitaa')}
				disabled={loading}
			>
				{reason === 'unlinked' ? 'ساخت حساب جدا برای ایتا' : 'ورود به حساب ایتا'}
			</button>
			<button
				class="ui-btn ui-btn-ghost"
				type="button"
				onclick={() => (open = false)}
				disabled={loading}
			>
				ادامه با حساب فعلی
			</button>
		</div>
	{/if}
</Modal>
