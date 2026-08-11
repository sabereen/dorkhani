import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	setKey: vi.fn(),
	store: {
		config: {
			supportLink: '',
			staleKhatmRetentionDays: 30,
			notification: { eitaa: false },
		},
	},
}))

vi.mock('$service/appSettings', () => ({
	appSettings_store: serviceMock.store,
	appSettingsService_setKey: serviceMock.setKey,
	MIN_STALE_KHATM_RETENTION_DAYS: 1,
	MAX_STALE_KHATM_RETENTION_DAYS: 3650,
}))
vi.mock('$service/auth', () => ({ auth_ensureIsAdmin: vi.fn() }))

import { actions } from './+page.server'

function submitRetentionDays(value: string) {
	const form = new FormData()
	form.set('supportLink', '')
	form.set('staleKhatmRetentionDays', value)
	return actions.default({
		request: new Request('http://localhost', { method: 'POST', body: form }),
	} as never)
}

describe('admin stale khatm retention setting', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('rejects a retention period outside the supported range', async () => {
		const result = await submitRetentionDays('0')

		expect(result).toMatchObject({ status: 400 })
		expect(serviceMock.setKey).not.toHaveBeenCalled()
	})

	it('persists a valid retention period', async () => {
		await submitRetentionDays('45')

		expect(serviceMock.setKey).toHaveBeenCalledWith('staleKhatmRetentionDays', 45)
	})
})
