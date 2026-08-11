<script lang="ts">
	import Header from '$lib/components/Header.svelte'
	import { authClient } from '$lib/auth-client'
	import { claimCreatedKhatms } from '$lib/auth/claimCreatedKhatms'
	import { base } from '$app/paths'
	import { goto, invalidateAll } from '$app/navigation'
	import { onMount } from 'svelte'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
	let email = $state('')
	let password = $state('')
	let loading = $state(false)
	let errorMessage = $state('')
	let eitaaAvailable = $state(false)

	onMount(() => {
		const check = () =>
			(eitaaAvailable = Boolean(data.authProviders.eitaa && window.Eitaa?.WebApp?.initData))
		check()
		const timer = window.setInterval(check, 250)
		window.setTimeout(() => window.clearInterval(timer), 5000)
		return () => window.clearInterval(timer)
	})

	async function finishLogin() {
		await claimCreatedKhatms()
		await invalidateAll()
		await goto(`${base}/account`)
	}

	async function signInEmail(event: SubmitEvent) {
		event.preventDefault()
		loading = true
		errorMessage = ''
		const result = await authClient.signIn.email({ email, password })
		loading = false
		if (result.error) {
			errorMessage = result.error.message || 'ورود ناموفق بود.'
			return
		}
		await finishLogin()
	}

	async function signInGoogle() {
		await authClient.signIn.social({ provider: 'google', callbackURL: `${base}/account` })
	}

	async function signInEitaa() {
		const initData = window.Eitaa?.WebApp?.initData
		if (!initData) return
		loading = true
		errorMessage = ''
		const response = await fetch(`${base}/api/auth/sign-in/eitaa`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ initData }),
		})
		loading = false
		if (!response.ok) {
			const result = await response.json().catch(() => null)
			errorMessage = result?.message || 'ورود با ایتا ناموفق بود.'
			return
		}
		await finishLogin()
	}
</script>

<svelte:head>
	<title>ورود | ختم قرآن</title>
	<script src="https://developer.eitaa.com/eitaa-web-app.js"></script>
</svelte:head>

<Header title="ورود" />
<div class="mx-auto mt-4 max-w-sm">
	{#if errorMessage}<div class="ui-alert ui-alert-error mb-3">{errorMessage}</div>{/if}
	<form class="ui-card ui-card-bordered" onsubmit={signInEmail}>
		<div class="ui-card-body grid gap-3">
			<label class="grid gap-1">
				ایمیل
				<input
					dir="ltr"
					class="ui-input"
					type="email"
					bind:value={email}
					autocomplete="email"
					required
				/>
			</label>
			<label class="grid gap-1">
				رمز عبور
				<input
					dir="ltr"
					class="ui-input"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					required
				/>
			</label>
			<button class="ui-btn ui-btn-primary" type="submit" disabled={loading}>ورود</button>
			<a class="text-center text-sm underline" href={`${base}/auth/forgot-password`}>
				رمز عبور را فراموش کرده‌ام
			</a>
		</div>
	</form>
	<div class="mt-3 grid gap-2">
		{#if data.authProviders.google}
			<button class="ui-btn ui-btn-outline" type="button" onclick={signInGoogle}>
				ورود با گوگل
			</button>
		{/if}
		{#if eitaaAvailable}
			<button class="ui-btn ui-btn-outline" type="button" onclick={signInEitaa} disabled={loading}>
				ورود با ایتا
			</button>
		{/if}
		<a class="ui-btn ui-btn-ghost" href={`${base}/auth/register`}>ساخت حساب جدید</a>
	</div>
</div>
