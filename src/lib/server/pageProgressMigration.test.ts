import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
	new URL(
		'../../../prisma/migrations/20260811020000_add_page_progress/migration.sql',
		import.meta.url,
	),
	'utf8',
)

const pages = Array.from(migration.matchAll(/^\s+\((\d+), (\d+), (\d+)\)[,;]$/gm)).map(
	([, start, end, count]) => ({ start: Number(start), end: Number(end), count: Number(count) }),
)

function coverage(start: number, end: number) {
	return pages.reduce((sum, page) => {
		const overlap = Math.max(0, Math.min(end, page.end) - Math.max(start, page.start))
		return sum + overlap / page.count
	}, 0)
}

describe('page progress migration', () => {
	it('embeds all contiguous Quran page boundaries', () => {
		expect(pages).toHaveLength(604)
		expect(pages[0]).toEqual({ start: 0, end: 7, count: 7 })
		expect(pages.at(-1)).toEqual({ start: 6221, end: 6236, count: 15 })
		expect(pages.every((page, index) => index === 0 || pages[index - 1].end === page.start)).toBe(
			true,
		)
	})

	it('supports empty, sequential, multi-part, completed and serial records', () => {
		const emptyProgress = 0
		const ayahProgress = (coverage(0, 17) / 604) * 100
		const rangeProgress = ((coverage(0, 1) + coverage(7, 12)) / 604) * 100
		const serialRoundProgress = rangeProgress

		expect(emptyProgress).toBe(0)
		expect(ayahProgress).toBeGreaterThan(0)
		expect(rangeProgress).toBeGreaterThan(0)
		expect(serialRoundProgress).toBe(rangeProgress)
		expect(migration).toContain("WHEN khatms.`status` = 'completed'")
		expect(migration).toContain("WHERE `range_type` = 'ayah'")
		expect(migration).toContain("WHERE khatms.`range_type` <> 'ayah'")
	})
})
