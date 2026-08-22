import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	getBySeriesRecord: vi.fn(),
	getDeletionReason: vi.fn(),
	getFullRecord: vi.fn(),
	toPublic: vi.fn(),
}))
const authMock = vi.hoisted(() => ({ checkIsAdmin: vi.fn(), ensureIsAdmin: vi.fn() }))

vi.mock('$service/khatm', () => ({
	khatmService_getBySeriesRecord: serviceMock.getBySeriesRecord,
	khatmService_getDeletionReason: serviceMock.getDeletionReason,
	khatmService_getFullRecord: serviceMock.getFullRecord,
	khatmService_toPublic: serviceMock.toPublic,
}))
vi.mock('$service/auth', () => ({
	auth_checkIsAdmin: authMock.checkIsAdmin,
	auth_ensureIsAdmin: authMock.ensureIsAdmin,
}))

import { GET } from './+server'

function loadKhatm(user: { id: string } | null = null, query = 'resource=k12') {
	const url = new URL(`http://localhost/api/khatm/page?${query}`)
	return GET({ url, request: new Request(url), locals: { user } } as never)
}

describe('khatm page API contract', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		authMock.checkIsAdmin.mockReturnValue(false)
	})

	it('preserves the deletion status contract', async () => {
		serviceMock.getFullRecord.mockResolvedValue(null)
		serviceMock.getDeletionReason.mockResolvedValue('owner')
		await expect(loadKhatm()).rejects.toMatchObject({
			status: 410,
			body: { type: 'khatm-deleted' },
		})
	})

	it('returns management permissions for the owner', async () => {
		serviceMock.toPublic.mockReturnValue({ id: 12 })
		serviceMock.getFullRecord.mockResolvedValue({
			id: 12,
			ownerId: 'owner-1',
			rangeType: 'page',
			private: false,
			status: 'inProgress',
			seriesId: null,
			series: null,
		})
		const response = await loadKhatm({ id: 'owner-1' })
		await expect(response.json()).resolves.toMatchObject({
			isAdmin: false,
			isOwner: true,
			canEdit: true,
		})
	})
})
