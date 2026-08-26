<script lang="ts">
	import { onMount } from 'svelte'
	import BaleMiniApp from './BaleMiniApp.svelte'
	import EitaaMiniApp from './EitaaMiniApp.svelte'
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import { withBasePath } from '$lib/config/runtime'
	import { decodeMiniAppTarget, type MiniAppHostName } from '$lib/miniapp/links'
	import { miniAppState } from '$lib/miniapp/state.svelte'

	type Props = {
		baleEnabled: boolean
		eitaaEnabled: boolean
	}

	const baleSdkUrl = 'https://tapi.bale.ai/miniapp.js?3'
	const eitaaSdkUrl = 'https://developer.eitaa.com/eitaa-web-app.js'

	function loadSdk(
		src: string,
		dataAttribute: string,
		isLoaded: () => boolean,
		failureMessage: string,
	) {
		if (isLoaded()) return Promise.resolve()

		const selector = `script[data-${dataAttribute}]`
		const existingScript = document.querySelector<HTMLScriptElement>(selector)
		if (existingScript) {
			return new Promise<void>((resolve, reject) => {
				existingScript.addEventListener('load', () => resolve(), { once: true })
				existingScript.addEventListener('error', () => reject(new Error(failureMessage)), {
					once: true,
				})
			})
		}

		const script = document.createElement('script')
		script.src = src
		script.async = true
		script.setAttribute(`data-${dataAttribute}`, '')

		return new Promise<void>((resolve, reject) => {
			script.addEventListener('load', () => resolve(), { once: true })
			script.addEventListener('error', () => reject(new Error(failureMessage)), { once: true })
			document.head.appendChild(script)
		})
	}

	function hasEitaaInitData(initData: string | undefined) {
		if (!initData) return false
		const params = new URLSearchParams(initData)
		return params.has('device_id') && params.has('auth_date') && params.has('hash')
	}

	function hasBaleInitData(initData: string | undefined) {
		if (!initData) return false
		const params = new URLSearchParams(initData)
		return params.has('auth_date') && params.has('hash') && !params.has('device_id')
	}

	const { baleEnabled, eitaaEnabled }: Props = $props()
	let host = $state<MiniAppHostName | null>(null)

	function getStartParam(initData: string | undefined) {
		const signedParam = initData ? new URLSearchParams(initData).get('start_param') : null
		return signedParam || new URL(location.href).searchParams.get('tgWebAppStartParam')
	}

	function activateHost(value: MiniAppHostName, initData: string | undefined) {
		host = value
		miniAppState.setHost(value)
		const target = decodeMiniAppTarget(getStartParam(initData))
		if (target) void goto(localizeHref(withBasePath(target, base)), { replaceState: true })
	}

	onMount(() => {
		let cancelled = false
		miniAppState.setHost(null)

		async function detectHost() {
			if (baleEnabled) {
				try {
					await loadSdk(
						baleSdkUrl,
						'bale-miniapp-sdk',
						() => Boolean(window.Bale?.WebApp),
						'Bale SDK failed to load',
					)
					if (hasBaleInitData(window.Bale?.WebApp?.initData)) {
						if (!cancelled) activateHost('bale', window.Bale?.WebApp?.initData)
						return
					}
				} catch {
					// Try Eitaa if the current host is not Bale or its SDK is unavailable.
				}
			}

			if (eitaaEnabled) {
				try {
					await loadSdk(
						eitaaSdkUrl,
						'eitaa-miniapp-sdk',
						() => Boolean(window.Eitaa?.WebApp),
						'Eitaa SDK failed to load',
					)
					if (hasEitaaInitData(window.Eitaa?.WebApp?.initData)) {
						if (!cancelled) activateHost('eitaa', window.Eitaa?.WebApp?.initData)
					}
				} catch {
					// Mini App SDKs are optional outside their host applications.
				}
			}
		}

		void detectHost()
		return () => {
			cancelled = true
			miniAppState.setHost(null)
		}
	})
</script>

{#if host === 'bale'}
	<BaleMiniApp enabled />
{:else if host === 'eitaa'}
	<EitaaMiniApp enabled />
{/if}
