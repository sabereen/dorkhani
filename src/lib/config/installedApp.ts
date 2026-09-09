import { isCapacitorBuild } from './runtime'

type StandaloneNavigator = Navigator & { standalone?: boolean }

export function isInstalledApp() {
	if (isCapacitorBuild) return true
	if (typeof window === 'undefined') return false
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		Boolean((navigator as StandaloneNavigator).standalone)
	)
}
