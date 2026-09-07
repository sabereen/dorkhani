import { browser } from '$app/environment'
import { untrack } from 'svelte'

export type ToastType = 'info' | 'error'

export const toastState = $state({
	open: false,
	message: '',
	type: 'info' as ToastType,
	counter: 0,
	timer: NaN,
})

export function toast(type: ToastType, message: string) {
	if (!browser) return

	untrack(() => {
		toastState.counter++
		toastState.open = true
		toastState.type = type
		toastState.message = message

		if (!isNaN(toastState.timer)) window.clearTimeout(toastState.timer)
		toastState.timer = window.setTimeout(() => {
			toastState.open = false
			toastState.timer = NaN
		}, 5_000)
	})
}
