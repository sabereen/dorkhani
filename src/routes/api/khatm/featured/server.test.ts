import { beforeEach, describe, expect, it, vi } from 'vitest'

const serviceMock = vi.hoisted(() => ({
	getList: vi.fn(),
	setFeatured: vi.fn(),
	reorder: vi.fn(),
}))
const authMock = vi.hoisted(() => vi.fn())
const featuredErrors = vi.hoisted(() => ({
	Eligibility: class extends Error {},
	Limit: class extends Error {},
	Order: class extends Error {},
}))

vi.mock('$service/auth', () => ({ auth_ensureIsAdmin: authMock }))
vi.mock('$service/khatm', () => ({
	KhatmFeaturedEligibilityError: featuredErrors.Eligibility,
	KhatmFeaturedLimitError: featuredErrors.Limit,
	KhatmFeaturedOrderError: featuredErrors.Order,
	khatmService_getFeaturedAdminList: serviceMock.getList,
	khatmService_setFeatured: serviceMock.setFeatured,
	khatmService_reorderFeatured: serviceMock.reorder,
}))

import { GET, POST, PUT } from './+server'

function event(method: string, body?: unknown) {
	return {
		request: new Request('http://localhost/api/khatm/featured', {
			method,
			body: body === undefined ? undefined : JSON.stringify(body),
			headers: { 'content-type': 'application/json' },
		}),
		setHeaders: vi.fn(),
	} as never
}

describe('featured khatm admin API', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		serviceMock.getList.mockResolvedValue([])
		serviceMock.setFeatured.mockResolvedValue([])
		serviceMock.reorder.mockResolvedValue([])
	})

	it('protects every method with admin authentication', async () => {
		await GET(event('GET'))
		await POST(event('POST', { khatmId: 12, featured: true }))
		await PUT(event('PUT', { seriesIds: [12] }))

		expect(authMock).toHaveBeenCalledTimes(3)
	})

	it('validates selection and ordering payloads before calling the service', async () => {
		await expect(POST(event('POST', { khatmId: '12', featured: true }))).rejects.toMatchObject({
			status: 400,
		})
		await expect(PUT(event('PUT', { seriesIds: '12' }))).rejects.toMatchObject({ status: 400 })
		expect(serviceMock.setFeatured).not.toHaveBeenCalled()
		expect(serviceMock.reorder).not.toHaveBeenCalled()
	})

	it('maps capacity and stale-order conflicts to 409 responses', async () => {
		serviceMock.setFeatured.mockRejectedValue(new featuredErrors.Limit())
		await expect(POST(event('POST', { khatmId: 12, featured: true }))).rejects.toMatchObject({
			status: 409,
		})

		serviceMock.reorder.mockRejectedValue(new featuredErrors.Order())
		await expect(PUT(event('PUT', { seriesIds: [12] }))).rejects.toMatchObject({ status: 409 })
	})

	it('maps an ineligible khatm to a descriptive 400 response', async () => {
		serviceMock.setFeatured.mockRejectedValue(new featuredErrors.Eligibility())
		await expect(POST(event('POST', { khatmId: 12, featured: true }))).rejects.toMatchObject({
			status: 400,
			body: { message: expect.stringContaining('دائمی') },
		})
	})
})
