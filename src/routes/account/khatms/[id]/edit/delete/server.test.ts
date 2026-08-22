import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({ delete: vi.fn() }))
const authMock = vi.hoisted(() => ({ checkIsAdmin: vi.fn(), ensureIsAdmin: vi.fn() }))

vi.mock('$service/khatm', () => ({
	KhatmOwnershipError: class KhatmOwnershipError extends Error {},
	khatmService_delete: serviceMock.delete,
}))
vi.mock('$service/auth', () => ({
	auth_checkIsAdmin: authMock.checkIsAdmin,
	auth_ensureIsAdmin: authMock.ensureIsAdmin,
}))

import { POST } from './+server'

describe('delete khatm endpoint', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		authMock.checkIsAdmin.mockReturnValue(false)
	})

	it('rejects a guest without admin credentials', async () => {
		await expect(
			POST({
				request: new Request('http://localhost/account/khatms/12/edit/delete', {
					method: 'POST',
				}),
				url: new URL('http://localhost/account/khatms/12/edit/delete'),
				locals: { user: null },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 401 })
	})

	it('lets an admin delete and redirects to the review queue', async () => {
		serviceMock.delete.mockResolvedValue(true)
		const url = new URL('http://localhost/account/khatms/12/edit/delete?admin=1')

		await expect(
			POST({
				request: new Request(url, {
					method: 'POST',
				}),
				url,
				locals: { user: null },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 303, location: '/admin/review' })
		expect(serviceMock.delete).toHaveBeenCalledWith({ kind: 'admin' }, 12)
		expect(authMock.ensureIsAdmin).toHaveBeenCalledOnce()
	})

	it('keeps the existing account redirect for an owner delete', async () => {
		serviceMock.delete.mockResolvedValue(true)
		const url = new URL('http://localhost/account/khatms/12/edit/delete')

		await expect(
			POST({
				request: new Request(url, { method: 'POST' }),
				url,
				locals: { user: { id: 'owner-1' } },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 303, location: '/account' })
		expect(serviceMock.delete).toHaveBeenCalledWith({ kind: 'owner', ownerId: 'owner-1' }, 12)
	})
})
