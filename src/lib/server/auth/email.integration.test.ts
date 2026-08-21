import { describe, expect, it } from 'vitest'
import { authEmail_isConfigured, authEmail_send } from './email'

describe('SMTP email delivery', () => {
	it.skip('sends a real test email using the configured SMTP transport', async () => {
		expect(authEmail_isConfigured()).toBe(true)

		await authEmail_send(
			'mqt.stb.h@gmail.com',
			'Dorkhani SMTP test',
			'This is a test email sent by the Dorkhani SMTP integration test.',
		)
	}, 30_000)
})
