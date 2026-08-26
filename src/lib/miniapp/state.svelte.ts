import type { MiniAppHostName } from './links'

let host = $state<MiniAppHostName | null>(null)

export const miniAppState = {
	get host() {
		return host
	},
	setHost(value: MiniAppHostName | null) {
		host = value
	},
}
