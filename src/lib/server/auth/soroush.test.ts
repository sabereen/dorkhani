import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { soroushAuth_verifyInitData } from './soroush'

const token = 'soroush-test-token'
const authDate = 1_800_000_000

function createInitData(overrides: Record<string, string> = {}) {
	const params = new URLSearchParams({
		auth_date: String(authDate),
		splus_query_id: 'query-1',
		user: JSON.stringify({ id: 'user-42', chat_id: 'chat-42', first_name: 'زهرا', username: 'zahra' }),
		...overrides,
	})
	const dataCheckString = [...params.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')
	const secret = createHash('sha256').update(token).digest()
	params.set('hash', createHmac('sha256', secret).update(dataCheckString).digest('hex'))
	return params.toString()
}

describe('soroushAuth_verifyInitData', () => {
	it('validates a signed Soroush Plus profile', () => {
		expect(soroushAuth_verifyInitData(createInitData(), authDate, token)).toMatchObject({
			id: 'user-42',
			chat_id: 'chat-42',
			first_name: 'زهرا',
			username: 'zahra',
		})
	})
	it('rejects tampering and a wrong bot token', () => {
		const valid = createInitData()
		expect(
			soroushAuth_verifyInitData(valid.replace('query-1', 'query-2'), authDate, token),
		).toBeNull()
		expect(soroushAuth_verifyInitData(valid, authDate, 'wrong-token')).toBeNull()
	})
	it('rejects expired and future data', () => {
		const valid = createInitData()
		expect(soroushAuth_verifyInitData(valid, authDate + 301, token)).toBeNull()
		expect(soroushAuth_verifyInitData(valid, authDate - 6, token)).toBeNull()
	})
	it('rejects malformed profile data', () => {
		expect(soroushAuth_verifyInitData(createInitData({ user: '{}' }), authDate, token)).toBeNull()
	})
})
