<script lang="ts">
	import { afterNavigate, goto, invalidateAll } from '$app/navigation'
	import { base } from '$app/paths'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import Modal from './Modal.svelte'
	import { onMount } from 'svelte'

	type Props = {
		enabled: boolean
	}

	type BaleAuthResult = {
		status?: 'authenticated' | 'choice-required'
		reason?: 'unlinked' | 'different-account'
		message?: string
	}

	const { enabled }: Props = $props()
	let initData = ''
	let open = $state(false)
	let loading = $state(false)
	let reason = $state<BaleAuthResult['reason']>()
	let errorMessage = $state('')

	afterNavigate(() => {
		const backButton = window.Bale?.WebApp?.BackButton
		if (!backButton) return
		if (location.pathname === `${base}/`) backButton.hide?.()
		else backButton.show?.()
	})

	async function authenticate(intent: 'auto' | 'link-current' | 'use-bale') {
		if (!initData || loading) return
		loading = true
		errorMessage = ''
		try {
			const response = await fetch(`${base}/api/auth/sign-in/bale`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ initData, intent }),
			})
			const result: BaleAuthResult = await response.json().catch(() => ({}))
			if (!response.ok) {
				errorMessage = result.message || 'ورود خودکار با بله ناموفق بود.'
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
			errorMessage = 'ارتباط با سرور برای ورود بله برقرار نشد.'
			open = true
		} finally {
			loading = false
		}
	}

	onMount(() => {
		if (!enabled) return
		const webApp = window.Bale?.WebApp
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
		void authenticate('auto')
		return () => {
			webApp.BackButton?.offClick?.(handleBack)
			webApp.SettingsButton?.offClick?.(handleSettings)
			webApp.BackButton?.hide?.()
			webApp.SettingsButton?.hide?.()
		}
	})
</script>

<Modal bind:open contentClass="ui-khatm-auth-dialog">
	<p class="ui-khatm-auth-eyebrow">ورود از بله</p>
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
			<button class="ui-btn ui-btn-soft" type="button" onclick={() => (open = false)}
				>ادامه بدون ورود بله</button
			>
		</div>
	{:else}
		<p class="ui-khatm-auth-description">
			{reason === 'different-account'
				? 'حساب بله به حساب دیگری متصل است. می‌توانید نشست فعلی را نگه دارید یا به حساب بله بروید.'
				: 'یک نشست فعال دارید. حساب بله را به همین نشست متصل کنید یا برای آن حساب جداگانه‌ای بسازید.'}
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
				onclick={() => authenticate('use-bale')}
				disabled={loading}
			>
				{reason === 'unlinked' ? 'ساخت حساب جدا برای بله' : 'ورود به حساب بله'}
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
