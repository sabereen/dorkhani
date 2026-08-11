import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { baleAuth_verifyInitData } from './bale'

const token = '123456:test-bale-token'
const authDate = 1786440000

function createInitData(overrides: Record<string, string> = {}) {
	const values = {
		auth_date: String(authDate),
		query_id: 'query-1',
		user: JSON.stringify({
			id: 4321,
			first_name: 'کاربر',
			allows_write_to_pm: true,
		}),
		...overrides,
	}
	const dataCheckString = Object.entries(values)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')
	const secret = createHmac('sha256', 'WebAppData').update(token).digest()
	const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex')
	return new URLSearchParams({ ...values, hash }).toString()
}

describe('baleAuth_verifyInitData', () => {
	it('accepts recent signed Bale init data', () => {
		expect(baleAuth_verifyInitData(createInitData(), authDate, token)).toMatchObject({
			id: 4321,
			first_name: 'کاربر',
			allows_write_to_pm: true,
		})
	})

	it('rejects tampering, a wrong token and stale data', () => {
		const valid = createInitData()
		expect(baleAuth_verifyInitData(valid.replace('query-1', 'query-2'), authDate, token)).toBeNull()
		expect(baleAuth_verifyInitData(valid, authDate, 'wrong-token')).toBeNull()
		expect(baleAuth_verifyInitData(valid, authDate + 301, token)).toBeNull()
	})

	it('rejects missing data and a future timestamp', () => {
		expect(baleAuth_verifyInitData('', authDate, token)).toBeNull()
		expect(baleAuth_verifyInitData(createInitData(), authDate - 6, token)).toBeNull()
	})
})
