<script lang="ts">
	import { onMount, type Component } from 'svelte'
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

	function detectLaunchHost(): MiniAppHostName | null {
		if (hasEitaaInitData(window.Eitaa?.WebApp?.initData)) return 'eitaa'
		if (hasBaleInitData(window.Bale?.WebApp?.initData)) return 'bale'

		const hash = location.hash.replace(/^#/, '')
		const queryIndex = hash.indexOf('?')
		const launchParams = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : hash)
		const initData = launchParams.get('tgWebAppData') || undefined

		if (hasEitaaInitData(initData)) return 'eitaa'
		if (hasBaleInitData(initData)) return 'bale'
		return null
	}

	const { baleEnabled, eitaaEnabled }: Props = $props()
	let host = $state<MiniAppHostName | null>(null)
	let ActiveMiniApp = $state<Component<{ enabled: boolean }>>()

	function getStartParam(initData: string | undefined) {
		const signedParam = initData ? new URLSearchParams(initData).get('start_param') : null
		return signedParam || new URL(location.href).searchParams.get('tgWebAppStartParam')
	}

	function activateHost(
		value: MiniAppHostName,
		initData: string | undefined,
		component: Component<{ enabled: boolean }>,
	) {
		ActiveMiniApp = component
		host = value
		miniAppState.setHost(value)
		const target = decodeMiniAppTarget(getStartParam(initData))
		if (target) void goto(localizeHref(withBasePath(target, base)), { replaceState: true })
	}

	onMount(() => {
		let cancelled = false
		miniAppState.setHost(null)

		async function detectHost() {
			const launchHost = detectLaunchHost()
			if (launchHost === 'bale' && baleEnabled) {
				try {
					await loadSdk(
						baleSdkUrl,
						'bale-miniapp-sdk',
						() => Boolean(window.Bale?.WebApp),
						'Bale SDK failed to load',
					)
					if (hasBaleInitData(window.Bale?.WebApp?.initData)) {
						const { default: component } = await import('./BaleMiniApp.svelte')
						if (!cancelled) activateHost('bale', window.Bale?.WebApp?.initData, component)
					}
				} catch {
					// Mini App integration is optional when its SDK is unavailable.
				}
			}

			if (launchHost === 'eitaa' && eitaaEnabled) {
				try {
					await loadSdk(
						eitaaSdkUrl,
						'eitaa-miniapp-sdk',
						() => Boolean(window.Eitaa?.WebApp),
						'Eitaa SDK failed to load',
					)
					if (hasEitaaInitData(window.Eitaa?.WebApp?.initData)) {
						const { default: component } = await import('./EitaaMiniApp.svelte')
						if (!cancelled) activateHost('eitaa', window.Eitaa?.WebApp?.initData, component)
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

{#if host && ActiveMiniApp}
	<ActiveMiniApp enabled />
{/if}
