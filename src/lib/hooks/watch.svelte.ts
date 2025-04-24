import { untrack } from 'svelte'

export function watchEager(source: () => void, callback: () => void) {
	$effect.pre(() => {
		source()
		return untrack(callback)
	})
}

export function watch(source: () => void, callback: () => void) {
	let firstTime = true
	watchEager(source, () => {
		if (firstTime) {
			firstTime = false
			return
		}
		return callback()
	})
}
