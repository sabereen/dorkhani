import { describe, expect, it } from 'vitest'
import { eitaaAuth_verifyInitData } from './eitaa'

const officialToken = '5768337691:AAGDAe6rjxu1cUgxK4BizYi--Utc3J9v5AU'
const officialInitData =
	'auth_date=1709144340&device_id=5d41402abc4b2a76b9719d911017c592&chat_instance=-3788475317572404878&chat_type=private&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22%D9%85%D9%87%D8%AF%DB%8C%22%2C%22last_name%22%3A%22%D9%87%D8%A7%D8%B4%D9%85%DB%8C%22%2C%22language_code%22%3A%22fa%22%2C%22allows_write_to_pm%22%3Atrue%7D&hash=c3bb1efcada7b75eec382110554ab07e57622e982a72cac38ba3e64f51d40bb9'

describe('eitaaAuth_verifyInitData', () => {
	it('accepts the official Eitaa validation sample', () => {
		expect(eitaaAuth_verifyInitData(officialInitData, 1709144340, officialToken)).toMatchObject({
			id: 279058397,
			first_name: 'مهدی',
			last_name: 'هاشمی',
		})
	})

	it('rejects a tampered hash', () => {
		const tampered = officialInitData.replace('c3bb1e', 'a3bb1e')
		expect(eitaaAuth_verifyInitData(tampered, 1709144340, officialToken)).toBeNull()
	})

	it('rejects a different app token', () => {
		expect(eitaaAuth_verifyInitData(officialInitData, 1709144340, 'wrong-token')).toBeNull()
	})

	it('rejects init data older than five minutes', () => {
		expect(eitaaAuth_verifyInitData(officialInitData, 1709144641, officialToken)).toBeNull()
	})

	it('rejects missing init data', () => {
		expect(eitaaAuth_verifyInitData('', 1709144340, officialToken)).toBeNull()
	})
})
