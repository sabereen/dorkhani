import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
	tKhatm: {
		findUnique: vi.fn(),
		update: vi.fn(),
	},
	tKhatmRecitation: { create: vi.fn() },
	$transaction: vi.fn(),
}))

const setAsCompletedMock = vi.hoisted(() => vi.fn())
const statisticsMock = vi.hoisted(() => ({
	increment: vi.fn(),
	applyCommitted: vi.fn(),
}))

vi.mock('$lib/server/db', () => ({ db: dbMock }))
vi.mock('./khatm', () => ({
	khatmService_setAsCompleted: setAsCompletedMock,
	khatmService_toPublic: (khatm: unknown) => khatm,
}))
vi.mock('./statistics', () => ({
	statisticsService_increment: statisticsMock.increment,
	statisticsService_applyCommitted: statisticsMock.applyCommitted,
}))

import { khatmPartService_pickNextAyat, khatmPartService_pickRange } from './khatmPart'

const baseKhatm = {
	id: 12,
	rangeType: 'free' as const,
	versesRead: 5,
	accessToken: null,
}

describe('khatm recitation tracking', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		dbMock.$transaction.mockImplementation(async (callback) => callback(dbMock))
	})

	it('records a range recitation in the same transaction as its progress update', async () => {
		dbMock.tKhatm.findUnique.mockResolvedValue(baseKhatm)
		dbMock.tKhatm.update.mockResolvedValue({ ...baseKhatm, versesRead: 20 })

		await khatmPartService_pickRange({
			khatmId: baseKhatm.id,
			accessToken: null,
			start: 5,
			end: 20,
		})

		expect(dbMock.$transaction).toHaveBeenCalledOnce()
		expect(dbMock.tKhatm.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: {
					versesRead: { increment: 15 },
					parts: { create: { start: 5, end: 20 } },
				},
			}),
		)
		expect(dbMock.tKhatmRecitation.create).toHaveBeenCalledWith({
			data: { khatmId: baseKhatm.id, verseCount: 15, created: expect.any(Date) },
		})
		expect(statisticsMock.increment).toHaveBeenCalledWith(
			dbMock,
			{ recitedAyahs: 15 },
			expect.any(Date),
		)
		expect(statisticsMock.applyCommitted).toHaveBeenCalledWith(
			{ recitedAyahs: 15 },
			expect.any(Date),
		)
		expect(setAsCompletedMock).not.toHaveBeenCalled()
	})

	it('records an ayah-oriented recitation in the same transaction as its progress update', async () => {
		const ayahKhatm = { ...baseKhatm, rangeType: 'ayah' as const, versesRead: 10 }
		dbMock.tKhatm.findUnique.mockResolvedValue(ayahKhatm)
		dbMock.tKhatm.update.mockResolvedValue({ ...ayahKhatm, versesRead: 17 })

		await khatmPartService_pickNextAyat({
			khatmId: ayahKhatm.id,
			accessToken: null,
			count: 7,
		})

		expect(dbMock.$transaction).toHaveBeenCalledOnce()
		expect(dbMock.tKhatm.update).toHaveBeenCalledWith({
			where: {
				id: ayahKhatm.id,
				versesRead: { lt: COUNT_OF_AYAHS - 7 + 1 },
			},
			data: { versesRead: { increment: 7 } },
		})
		expect(dbMock.tKhatmRecitation.create).toHaveBeenCalledWith({
			data: { khatmId: ayahKhatm.id, verseCount: 7, created: expect.any(Date) },
		})
		expect(statisticsMock.increment).toHaveBeenCalledWith(
			dbMock,
			{ recitedAyahs: 7 },
			expect.any(Date),
		)
		expect(statisticsMock.applyCommitted).toHaveBeenCalledWith(
			{ recitedAyahs: 7 },
			expect.any(Date),
		)
		expect(setAsCompletedMock).not.toHaveBeenCalled()
	})
})
