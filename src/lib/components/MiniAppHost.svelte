<script lang="ts">
	import { onMount, type Component } from 'svelte'
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import { withBasePath } from '$lib/config/runtime'
	import { decodeMiniAppTarget, type MiniAppHostName } from '$lib/miniapp/links'
	import { detectMiniAppHost, hasBaleInitData, hasEitaaInitData, hasSoroushInitData } from '$lib/miniapp/host'
	import { miniAppState } from '$lib/miniapp/state.svelte'

	type Props = {
		baleEnabled: boolean
		eitaaEnabled: boolean
		soroushEnabled: boolean
	}

	const baleSdkUrl = 'https://tapi.bale.ai/miniapp.js?3'
	const eitaaSdkUrl = 'https://developer.eitaa.com/eitaa-web-app.js'
	const soroushSdkUrl = 'https://webapp.splus.ir/sdk/soroush-web-app.js'

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

	function detectLaunchHost(): MiniAppHostName | null {
		const hash = location.hash.replace(/^#/, '')
		const queryIndex = hash.indexOf('?')
		const launchParams = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : hash)
		return detectMiniAppHost({
			soroush: window.Splus?.WebApp?.initData,
			eitaa: window.Eitaa?.WebApp?.initData,
			bale: window.Bale?.WebApp?.initData,
			launch: launchParams.get('tgWebAppData') || undefined,
		})
	}

	const { baleEnabled, eitaaEnabled, soroushEnabled }: Props = $props()
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
			if (launchHost === 'soroush' && soroushEnabled) {
				try {
					await loadSdk(
						soroushSdkUrl,
						'soroush-miniapp-sdk',
						() => Boolean(window.Splus?.WebApp),
						'Soroush Plus SDK failed to load',
					)
					if (hasSoroushInitData(window.Splus?.WebApp?.initData)) {
						const { default: component } = await import('./SoroushMiniApp.svelte')
						if (!cancelled) activateHost('soroush', window.Splus?.WebApp?.initData, component)
					}
				} catch {
					// Mini App integration is optional when its SDK is unavailable.
				}
			}

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
