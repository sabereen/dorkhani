import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
	user: { findUnique: vi.fn() },
}))
const emailMock = vi.hoisted(() => ({
	isConfigured: vi.fn(() => true),
	send: vi.fn(),
}))

vi.mock('$app/paths', () => ({ base: '' }))
vi.mock('$env/dynamic/private', () => ({
	env: {
		ORIGIN: 'https://example.com',
		BALE_BOT_TOKEN: 'bale-token',
		EITAA_APP_TOKEN: 'eitaa-token',
		BALE_MINI_APP_URL: 'https://ble.ir/khatm-app',
		EITAA_MINI_APP_URL: 'https://eitaa.com/khatm-app/main',
	},
}))
vi.mock('$lib/server/db', () => ({ db: dbMock }))
vi.mock('$lib/server/auth/email', () => ({
	authEmail_isConfigured: emailMock.isConfigured,
	authEmail_send: emailMock.send,
}))

import { userNotification_send } from './user-notification'

const event = {
	type: 'participationPicked' as const,
	title: 'ختم آزمایشی',
	description: 'از 1:1 تا 1:7',
	targetPath: '/1:1-1:7',
}

function userResult(overrides: Record<string, unknown> = {}) {
	return {
		id: 'user-1',
		email: 'user@example.com',
		emailVerified: true,
		notificationPreference: {
			enabled: true,
			preferredChannel: null,
			baleEnabled: true,
			eitaaEnabled: true,
			emailEnabled: true,
		},
		notificationEndpoints: [
			{ channel: 'bale', address: '10', canSend: true },
			{ channel: 'eitaa', address: '20', canSend: true },
		],
		...overrides,
	}
}

describe('userNotification_send', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		emailMock.isConfigured.mockReturnValue(true)
	})

	it('uses the fixed Bale, Eitaa, email priority by default', async () => {
		dbMock.user.findUnique.mockResolvedValue(userResult())
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
		vi.stubGlobal('fetch', fetchMock)

		await userNotification_send('user-1', event)

		expect(fetchMock).toHaveBeenCalledOnce()
		expect(fetchMock.mock.calls[0][0]).toContain('tapi.bale.ai')
		expect(emailMock.send).not.toHaveBeenCalled()
	})

	it('falls back immediately when the preferred provider fails', async () => {
		dbMock.user.findUnique.mockResolvedValue(userResult())
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error('Bale unavailable'))
			.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
		vi.stubGlobal('fetch', fetchMock)
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		await userNotification_send('user-1', event)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(fetchMock.mock.calls[1][0]).toContain('eitaayar.ir')
		consoleSpy.mockRestore()
	})

	it('does nothing when notifications are disabled', async () => {
		dbMock.user.findUnique.mockResolvedValue(
			userResult({ notificationPreference: { enabled: false } }),
		)
		const fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)

		await userNotification_send('user-1', event)

		expect(fetchMock).not.toHaveBeenCalled()
		expect(emailMock.send).not.toHaveBeenCalled()
	})

	it('uses the Bale Mini App link in the forwarding message and button', async () => {
		dbMock.user.findUnique.mockResolvedValue(userResult())
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
		vi.stubGlobal('fetch', fetchMock)

		await userNotification_send('user-1', {
			type: 'khatmCreated',
			khatmId: 42,
			title: 'Test khatm',
			private: true,
			khatmPath: '/k42?t=private-token',
		})

		const forwardBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
		expect(forwardBody.text).toContain('https://ble.ir/khatm-app?startapp=')
		expect(forwardBody.reply_markup.inline_keyboard[0][0].url).toContain(
			'https://ble.ir/khatm-app?startapp=',
		)
	})

	it('uses the Eitaa Mini App link in its forwarding message', async () => {
		dbMock.user.findUnique.mockResolvedValue(
			userResult({
				notificationPreference: {
					enabled: true,
					preferredChannel: 'eitaa',
					baleEnabled: true,
					eitaaEnabled: true,
					emailEnabled: true,
				},
			}),
		)
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
		vi.stubGlobal('fetch', fetchMock)

		await userNotification_send('user-1', {
			type: 'khatmCreated',
			khatmId: 42,
			title: 'Test khatm',
			private: false,
			khatmPath: '/a42',
		})

		const forwardBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
		expect(forwardBody.text).toContain('https://eitaa.com/khatm-app/main?startapp=')
	})
})
