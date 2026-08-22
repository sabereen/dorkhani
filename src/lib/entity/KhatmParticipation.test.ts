import type { KhatmData } from './KhatmData'
import { KhatmParticipation } from './KhatmParticipation.svelte'
import { PickedKhatmPart } from './PickedKhatmPart'
import { QuranRange } from './Range'
import { roundPercent } from '$lib/utility/percent'
import { describe, expect, it } from 'vitest'

describe('KhatmParticipation', () => {
	it('calculates personal participation by page weight', () => {
		const khatm = { id: 12 } as KhatmData
		const participation = new KhatmParticipation(() => khatm)
		participation.items = [
			new PickedKhatmPart({
				id: 1,
				date: new Date('2026-08-11T00:00:00Z'),
				start: 0,
				end: 1,
				khatm,
			}),
		]

		const expected = roundPercent(new QuranRange(0, 1).getCoveragePercent() * 100, false)
		expect(participation.currentPercent).toBe(expected)
	})
})
