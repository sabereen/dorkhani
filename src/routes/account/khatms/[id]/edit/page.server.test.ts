import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	edit: vi.fn(),
	getForEdit: vi.fn(),
}))
const authMock = vi.hoisted(() => ({ checkIsAdmin: vi.fn(), ensureIsAdmin: vi.fn() }))

vi.mock('$service/khatm', () => {
	class KhatmOwnershipError extends Error {}
	class KhatmRangeLockedError extends Error {}
	class KhatmHistoricalRoundError extends Error {}

	return {
		KhatmHistoricalRoundError,
		KhatmOwnershipError,
		KhatmRangeLockedError,
		khatmService_edit: serviceMock.edit,
		khatmService_getForEdit: serviceMock.getForEdit,
	}
})
vi.mock('$service/auth', () => ({
	auth_checkIsAdmin: authMock.checkIsAdmin,
	auth_ensureIsAdmin: authMock.ensureIsAdmin,
}))

import { KhatmOwnershipError } from '$service/khatm'
import { actions } from './+page.server'

function editRequest() {
	const form = new FormData()
	form.set('title', 'عنوان')
	form.set('description', '')
	form.set('rangeType', 'page')
	form.set('access', 'public')
	return new Request('http://localhost/account/khatms/12/edit', { method: 'POST', body: form })
}

describe('edit owned khatm action', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		authMock.checkIsAdmin.mockReturnValue(false)
	})

	it('returns 401 when a guest submits an edit', async () => {
		await expect(
			actions.default({
				request: editRequest(),
				url: new URL('http://localhost/account/khatms/12/edit'),
				locals: { user: null },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 401 })
	})

	it('returns 403 when a different owner submits an edit', async () => {
		serviceMock.edit.mockRejectedValue(new KhatmOwnershipError())

		await expect(
			actions.default({
				request: editRequest(),
				url: new URL('http://localhost/account/khatms/12/edit'),
				locals: { user: { id: 'owner-2' } },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 403 })
	})

	it('keeps the existing account redirect for an owner edit', async () => {
		serviceMock.edit.mockResolvedValue({ id: 12, rangeType: 'page', seriesId: null })

		await expect(
			actions.default({
				request: editRequest(),
				url: new URL('http://localhost/account/khatms/12/edit'),
				locals: { user: { id: 'owner-1' } },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 303, location: '/account' })
		expect(serviceMock.edit).toHaveBeenCalledWith(
			{ kind: 'owner', ownerId: 'owner-1' },
			12,
			expect.objectContaining({ title: 'عنوان' }),
		)
	})

	it('lets an admin edit without a user session and returns to the khatm detail', async () => {
		serviceMock.edit.mockResolvedValue({ id: 12, rangeType: 'page', seriesId: null })
		const url = new URL('http://localhost/account/khatms/12/edit?admin=1')

		await expect(
			actions.default({
				request: editRequest(),
				url,
				locals: { user: null },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 303, location: '/k12?admin=1' })
		expect(serviceMock.edit).toHaveBeenCalledWith(
			{ kind: 'admin' },
			12,
			expect.objectContaining({ title: 'عنوان' }),
		)
		expect(authMock.ensureIsAdmin).toHaveBeenCalledOnce()
	})
})
