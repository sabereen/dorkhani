import type { Khatm } from '$lib/entity/Khatm.svelte'
import type { KhatmPart } from '$lib/entity/KhatmPart'
import { getContext, setContext } from 'svelte'

const key = Symbol('khatm')

type KhatmContext = {
	readonly khatm: Khatm
	readonly parts: KhatmPart[]
}

export function useKathmContext() {
	return getContext<KhatmContext>(key)
}

export function setKhatmContext(ctx: KhatmContext) {
	setContext(key, ctx)
}
