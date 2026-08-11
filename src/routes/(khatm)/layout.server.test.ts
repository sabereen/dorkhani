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

import { load } from './+layout.server'

function loadKhatm(
	{ user = null, url = 'http://localhost/k12' }: { user?: { id: string } | null; url?: string } = {},
) {
	return load({
		params: { khatm: 'k12' },
		url: new URL(url),
		request: new Request(url),
		locals: { user },
	} as never)
}

describe('deleted khatm page', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		authMock.checkIsAdmin.mockReturnValue(false)
		serviceMock.getFullRecord.mockResolvedValue(null)
	})

	it('returns 410 with the deletion message for a tombstoned id', async () => {
		serviceMock.getDeletionReason.mockResolvedValue('owner')

		await expect(loadKhatm()).rejects.toMatchObject({
			status: 410,
			body: { message: 'این ختم توسط سازنده حذف شده است.', type: 'khatm-deleted' },
		})
	})

	it('returns 410 with the expiry message for an automatically removed khatm', async () => {
		serviceMock.getDeletionReason.mockResolvedValue('expiredUnstarted')

		await expect(loadKhatm()).rejects.toMatchObject({
			status: 410,
			body: {
				message: 'این ختم به‌دلیل آغاز نشدن در مهلت تعیین‌شده، به‌صورت خودکار حذف شده است.',
				type: 'khatm-expired',
			},
		})
	})

	it('keeps returning 404 for an id that never existed', async () => {
		serviceMock.getDeletionReason.mockResolvedValue(null)
		await expect(loadKhatm()).rejects.toMatchObject({ status: 404 })
	})

	it('returns the admin deletion message', async () => {
		serviceMock.getDeletionReason.mockResolvedValue('admin')

		await expect(loadKhatm()).rejects.toMatchObject({
			status: 410,
			body: { message: 'این ختم توسط مدیر سامانه حذف شده است.', type: 'khatm-deleted' },
		})
	})
})

describe('khatm management permissions', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		serviceMock.toPublic.mockReturnValue({ id: 12 })
		serviceMock.getFullRecord.mockResolvedValue({
			id: 12,
			ownerId: 'owner-1',
			rangeType: 'page',
			private: true,
			accessToken: 'private-token',
			seriesId: null,
			series: null,
		})
	})

	it('lets an admin bypass a private access token and edit the khatm', async () => {
		await expect(loadKhatm({ url: 'http://localhost/k12?admin=1' })).resolves.toMatchObject({
			isAdmin: true,
			isOwner: false,
			canEdit: true,
		})
		expect(serviceMock.getFullRecord).toHaveBeenCalledWith(12, null, {
			bypassAccessToken: true,
		})
		expect(authMock.ensureIsAdmin).toHaveBeenCalledOnce()
	})

	it('keeps edit permission for the owner without marking them as admin', async () => {
		authMock.checkIsAdmin.mockReturnValue(false)

		await expect(loadKhatm({ user: { id: 'owner-1' } })).resolves.toMatchObject({
			isAdmin: false,
			isOwner: true,
			canEdit: true,
		})
	})
})
