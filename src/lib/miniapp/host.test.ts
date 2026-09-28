import { describe, expect, it } from 'vitest'
import { detectMiniAppHost, hasBaleInitData, hasSoroushInitData } from './host'

const common = 'auth_date=1800000000&hash=' + 'a'.repeat(64)

describe('Mini App host detection', () => {
	it('detects Soroush Plus only from its signed marker or SDK data', () => {
		const soroush = `${common}&splus_query_id=splus-1`
		expect(hasSoroushInitData(soroush)).toBe(true)
		expect(detectMiniAppHost({ launch: soroush })).toBe('soroush')
		expect(detectMiniAppHost({ soroush })).toBe('soroush')
	})
	it('does not mistake Soroush Plus data for Bale', () => {
		const soroush = `${common}&splus_query_id=splus-1`
		expect(hasBaleInitData(soroush)).toBe(false)
		expect(detectMiniAppHost({ launch: common })).toBe('bale')
	})
})
