import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
	tAppSettings: {
		findUnique: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
	},
}))

vi.mock('../db', () => ({ db: dbMock }))

import {
	appSettings_store,
	appSettingsService_update,
	DEFAULT_STALE_KHATM_RETENTION_DAYS,
} from './appSettings'

describe('stale khatm retention setting', () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	it('uses the 30-day default for settings saved before the option existed', async () => {
		dbMock.tAppSettings.findUnique.mockResolvedValue({
			id: 1,
			config: { supportLink: '', notification: { eitaa: false } },
		})

		await appSettingsService_update()

		expect(appSettings_store.config.staleKhatmRetentionDays).toBe(
			DEFAULT_STALE_KHATM_RETENTION_DAYS,
		)
	})

	it('loads a valid configured retention period', async () => {
		dbMock.tAppSettings.findUnique.mockResolvedValue({
			id: 1,
			config: {
				supportLink: '',
				staleKhatmRetentionDays: 45,
				notification: { eitaa: false },
			},
		})

		await appSettingsService_update()

		expect(appSettings_store.config.staleKhatmRetentionDays).toBe(45)
	})
})
