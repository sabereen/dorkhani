import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	editOwned: vi.fn(),
	getOwnedForEdit: vi.fn(),
}))

vi.mock('$service/khatm', () => {
	class KhatmOwnershipError extends Error {}
	class KhatmRangeLockedError extends Error {}
	class KhatmHistoricalRoundError extends Error {}

	return {
		KhatmHistoricalRoundError,
		KhatmOwnershipError,
		KhatmRangeLockedError,
		khatmService_editOwned: serviceMock.editOwned,
		khatmService_getOwnedForEdit: serviceMock.getOwnedForEdit,
	}
})

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
	beforeEach(() => vi.resetAllMocks())

	it('returns 401 when a guest submits an edit', async () => {
		await expect(
			actions.default({
				request: editRequest(),
				locals: { user: null },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 401 })
	})

	it('returns 403 when a different owner submits an edit', async () => {
		serviceMock.editOwned.mockRejectedValue(new KhatmOwnershipError())

		await expect(
			actions.default({
				request: editRequest(),
				locals: { user: { id: 'owner-2' } },
				params: { id: '12' },
			} as never),
		).rejects.toMatchObject({ status: 403 })
	})
})
