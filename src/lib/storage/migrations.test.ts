import { beforeEach, describe, expect, it, vi } from 'vitest'

const databaseMock = vi.hoisted(() => ({
	getCapabilities: vi.fn(),
	query: vi.fn(),
	transaction: vi.fn(),
}))

vi.mock('$lib/native/database', () => ({ nativeDatabase: databaseMock }))

import { runNativeStorageMigrations } from './migrations'

describe('native storage migrations', () => {
	beforeEach(() => {
		databaseMock.getCapabilities.mockReset().mockResolvedValue({
			apiVersion: 1,
			nativeSchemaVersion: 1,
			sqliteVersion: 'test',
		})
		databaseMock.query.mockReset().mockResolvedValue({ columns: [], rows: [] })
		databaseMock.transaction.mockReset().mockResolvedValue({ results: [] })
	})

	it('runs ordered migrations and records each version atomically', async () => {
		const result = await runNativeStorageMigrations({
			minimumNativeApiVersion: 1,
			minimumNativeSchemaVersion: 1,
			migrations: [
				{ version: 2, statements: [{ sql: 'CREATE TABLE js_extra(id INTEGER)' }] },
				{ version: 1, statements: [] },
			],
		})

		expect(result.jsSchemaVersion).toBe(2)
		expect(databaseMock.transaction).toHaveBeenCalledTimes(2)
		expect(databaseMock.transaction.mock.calls[1][0].statements).toEqual([
			{ sql: 'CREATE TABLE js_extra(id INTEGER)' },
			expect.objectContaining({ values: ['js_schema_version', '2'] }),
		])
	})

	it('rejects incompatible or destructive migrations', async () => {
		await expect(
			runNativeStorageMigrations({
				minimumNativeApiVersion: 2,
				minimumNativeSchemaVersion: 1,
				migrations: [],
			}),
		).rejects.toThrow('not compatible')

		await expect(
			runNativeStorageMigrations({
				minimumNativeApiVersion: 1,
				minimumNativeSchemaVersion: 1,
				migrations: [{ version: 1, statements: [{ sql: 'DROP TABLE local_zekrs' }] }],
			}),
		).rejects.toThrow('preserve the native widget schema')
	})
})
