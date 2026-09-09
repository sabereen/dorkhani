import { getOfflineAyahInfoRange } from './quran'
import { describe, expect, it } from 'vitest'

describe('offline Quran data', () => {
	it('returns bundled Hafs text and the selected translation', () => {
		const ansarian = getOfflineAyahInfoRange({ start: 0, end: 2 }, 'ansarian')
		const makarem = getOfflineAyahInfoRange({ start: 0, end: 2 }, 'makarem')

		expect(ansarian).toHaveLength(2)
		expect(ansarian[0].index).toBe(0)
		expect(ansarian[0].textHafs).toBeTruthy()
		expect(ansarian[0].translation).toBeTruthy()
		expect(makarem[0].translation).not.toBe(ansarian[0].translation)
	})
})
