import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({ delete: vi.fn(), edit: vi.fn(), getForEdit: vi.fn() }))
const authMock = vi.hoisted(() => ({ checkIsAdmin: vi.fn(), ensureIsAdmin: vi.fn() }))

vi.mock('$service/khatm', () => ({
	KhatmHistoricalRoundError: class KhatmHistoricalRoundError extends Error {},
	KhatmOwnershipError: class KhatmOwnershipError extends Error {},
	KhatmRangeLockedError: class KhatmRangeLockedError extends Error {},
	khatmService_delete: serviceMock.delete,
	khatmService_edit: serviceMock.edit,
	khatmService_getForEdit: serviceMock.getForEdit,
}))
vi.mock('$service/auth', () => ({
	auth_checkIsAdmin: authMock.checkIsAdmin,
	auth_ensureIsAdmin: authMock.ensureIsAdmin,
}))

import { DELETE, PUT } from './+server'

function event(method: 'PUT' | 'DELETE', user: { id: string } | null = null, admin = false) {
	const url = new URL(`http://localhost/api/account/khatms/12${admin ? '?admin=1' : ''}`)
	return {
		request: new Request(url, {
			method,
			body:
				method === 'PUT'
					? JSON.stringify({ title: 'عنوان', description: '', rangeType: 'page', private: false })
					: undefined,
			headers: method === 'PUT' ? { 'content-type': 'application/json' } : undefined,
		}),
		url,
		locals: { user },
		params: { id: '12' },
	}
}

describe('khatm management API contract', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		authMock.checkIsAdmin.mockReturnValue(false)
	})

	it('returns 401 for an unauthenticated owner mutation', async () => {
		await expect(PUT(event('PUT') as never)).rejects.toMatchObject({ status: 401 })
	})

	it('edits on behalf of the authenticated owner', async () => {
		serviceMock.edit.mockResolvedValue({ id: 12 })
		const response = await PUT(event('PUT', { id: 'owner-1' }) as never)
		expect(response.status).toBe(200)
		expect(serviceMock.edit).toHaveBeenCalledWith(
			{ kind: 'owner', ownerId: 'owner-1' },
			12,
			expect.objectContaining({ title: 'عنوان', rangeType: 'page' }),
		)
	})

	it('allows an authenticated admin endpoint to delete', async () => {
		serviceMock.delete.mockResolvedValue(true)
		const response = await DELETE(event('DELETE', null, true) as never)
		expect(response.status).toBe(204)
		expect(authMock.ensureIsAdmin).toHaveBeenCalledOnce()
		expect(serviceMock.delete).toHaveBeenCalledWith({ kind: 'admin' }, 12)
	})
})
