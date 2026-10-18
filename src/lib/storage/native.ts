import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type {
	KhatmData,
	OfflineKhatmPartRecord,
	OfflineKhatmRecord,
	ZekrRecord,
} from '$lib/contracts/domain'
import { nativeDatabase, type SqlChangesResult, type SqlValue } from '$lib/native/database'
import { QuranRange } from '$lib/entity/Range'
import { v4 as uuid } from 'uuid'
import type { ClientDatabaseStorage } from './contracts'
import {
	calculateOfflineKhatmProgress,
	OfflineKhatmConflictError,
	OfflineKhatmNotFoundError,
	OfflineKhatmRangeLockedError,
	offlineKhatmRangesOverlap,
	normalizeOfflineKhatmInput,
} from './offline-domain'
import type { CreatedKhatmRecord, LocalZekrRecord, PickedKhatmPartRecord } from './types'
import { runNativeStorageMigrations } from './migrations'

type Row = Record<string, SqlValue>
type OfflineRow = { record: OfflineKhatmRecord; revision: number }

function epoch(value: Date | string | null) {
	return value == null ? null : new Date(value).getTime()
}

function numberValue(value: SqlValue | undefined) {
	return typeof value === 'number' ? value : Number(value)
}

function stringValue(value: SqlValue | undefined) {
	return typeof value === 'string' ? value : String(value ?? '')
}

function nullableString(value: SqlValue | undefined) {
	return value == null ? null : stringValue(value)
}

function parseJson<T>(value: SqlValue | undefined): T {
	if (typeof value !== 'string') throw new Error('Native storage returned invalid JSON.')
	return JSON.parse(value) as T
}

function serializeSnapshot(value: unknown) {
	return JSON.stringify({ version: 1, data: value })
}

function parseSnapshot<T>(value: SqlValue | undefined): T {
	const parsed = parseJson<T | { version: number; data: T }>(value)
	if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
		return (parsed as { data: T }).data
	}
	return parsed as T
}

function limitSql(limit?: number) {
	return limit && limit > 0 ? { sql: ' LIMIT ?', values: [Math.floor(limit)] } : { sql: '', values: [] }
}

async function rows(sql: string, values: SqlValue[] = []) {
	return (await nativeDatabase.query({ sql, values })).rows
}

function changes(result: SqlChangesResult | { columns: string[]; rows: Row[] }) {
	return 'changes' in result ? result.changes : 0
}

function createdFromRow(row: Row): CreatedKhatmRecord {
	return {
		id: numberValue(row.id),
		khatm: parseSnapshot<KhatmData>(row.payload_json),
		claimToken: nullableString(row.claim_token) ?? undefined,
	}
}

function pickedFromRow(row: Row): PickedKhatmPartRecord {
	return {
		id: numberValue(row.id),
		date: new Date(numberValue(row.picked_at)),
		start: numberValue(row.start),
		end: numberValue(row.end),
		khatm: parseSnapshot<KhatmData>(row.payload_json),
		hash: nullableString(row.hash),
	}
}

function localZekrFromRow(row: Row): LocalZekrRecord {
	return {
		id: numberValue(row.id),
		zekr: parseSnapshot<ZekrRecord>(row.payload_json),
		isMine: numberValue(row.is_mine) === 1,
		myCount: numberValue(row.my_count),
	}
}

const offlineSelect = `
	SELECT id, title, description, range_type, series, series_stopped, round_number,
		round_created, status, verses_read, page_progress, created_at, updated_at,
		end_date, completed_rounds_json, revision
	FROM offline_khatms`

function offlineFromRow(row: Row): OfflineRow {
	const roundsPayload = parseJson<
		| Array<{ roundNumber: number; created: number; completed: number }>
		| {
				version: number
				rounds: Array<{ roundNumber: number; created: number; completed: number }>
			}
	>(row.completed_rounds_json)
	const rounds = Array.isArray(roundsPayload) ? roundsPayload : roundsPayload.rounds
	return {
		revision: numberValue(row.revision),
		record: {
			id: stringValue(row.id),
			title: stringValue(row.title),
			description: stringValue(row.description),
			rangeType: stringValue(row.range_type) as OfflineKhatmRecord['rangeType'],
			series: numberValue(row.series) === 1,
			seriesStopped: numberValue(row.series_stopped) === 1,
			roundNumber: numberValue(row.round_number),
			roundCreated: new Date(numberValue(row.round_created)),
			status: stringValue(row.status) as OfflineKhatmRecord['status'],
			versesRead: numberValue(row.verses_read),
			pageProgress: numberValue(row.page_progress),
			created: new Date(numberValue(row.created_at)),
			updated: new Date(numberValue(row.updated_at)),
			endDate: row.end_date == null ? null : new Date(numberValue(row.end_date)),
			completedRounds: rounds.map((round) => ({
				roundNumber: round.roundNumber,
				created: new Date(round.created),
				completed: new Date(round.completed),
			})),
		},
	}
}

function serializeRounds(rounds: OfflineKhatmRecord['completedRounds']) {
	return JSON.stringify({
		version: 1,
		rounds: rounds.map((round) => ({
			roundNumber: round.roundNumber,
			created: round.created.getTime(),
			completed: round.completed.getTime(),
		})),
	})
}

function partFromRow(row: Row): OfflineKhatmPartRecord {
	return {
		id: stringValue(row.id),
		khatmId: stringValue(row.khatm_id),
		roundNumber: numberValue(row.round_number),
		start: numberValue(row.start),
		end: numberValue(row.end),
		created: new Date(numberValue(row.created_at)),
	}
}

async function getOfflineRow(id: string) {
	const result = await rows(`${offlineSelect} WHERE id = ?`, [id])
	if (!result[0]) throw new OfflineKhatmNotFoundError('ختم آفلاین پیدا نشد.')
	return offlineFromRow(result[0])
}

async function getOfflineParts(id: string, roundNumber: number) {
	return (
		await rows(
			`SELECT id, khatm_id, round_number, start, end, created_at
			 FROM offline_khatm_parts
			 WHERE khatm_id = ? AND round_number = ? ORDER BY start`,
			[id, roundNumber],
		)
	).map(partFromRow)
}

export function createNativeStorage(): ClientDatabaseStorage {
	return {
		ready: async () => {
			await runNativeStorageMigrations({
				minimumNativeApiVersion: 1,
				minimumNativeSchemaVersion: 1,
				migrations: [{ version: 1, statements: [] }],
			})
		},

		createdKhatms: {
			async add(item) {
				await nativeDatabase.execute({
					sql: `INSERT INTO created_khatms
						(id, title, created_at, series_id, is_private, claim_token, payload_json, revision)
						VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
					values: [
						item.khatm.id,
						item.khatm.title,
						epoch(item.khatm.created),
						item.khatm.seriesId,
						item.khatm.private,
						item.claimToken ?? null,
						serializeSnapshot(item.khatm),
					],
				})
			},

			async getList(limit) {
				const suffix = limitSql(limit)
				return (
					await rows(
						`SELECT id, claim_token, payload_json FROM created_khatms ORDER BY created_at DESC${suffix.sql}`,
						suffix.values,
					)
				).map(createdFromRow)
			},

			async getClaims() {
				return (
					await rows(
						`SELECT id, claim_token FROM created_khatms
						 WHERE claim_token IS NOT NULL AND claim_token <> ''`,
					)
				).map((row) => ({ id: numberValue(row.id), token: stringValue(row.claim_token) }))
			},

			async hasClaim(khatmId, seriesId) {
				const result = await rows(
					`SELECT 1 AS found FROM created_khatms
					 WHERE claim_token IS NOT NULL AND claim_token <> ''
					 AND (id = ? OR (? IS NOT NULL AND series_id = ?)) LIMIT 1`,
					[khatmId, seriesId ?? null, seriesId ?? null],
				)
				return result.length > 0
			},

			async clearClaimTokens(ids) {
				if (!ids.length) return
				await nativeDatabase.execute({
					sql: `UPDATE created_khatms SET claim_token = NULL, revision = revision + 1
					WHERE id IN (${ids.map(() => '?').join(', ')})`,
					values: [...ids],
				})
			},
		},

		pickedKhatmParts: {
			async add(item) {
				await nativeDatabase.execute({
					sql: `INSERT INTO picked_khatm_parts
						(picked_at, start, end, hash, khatm_id, series_id, khatm_title, is_private, payload_json)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					values: [
						item.date.getTime(),
						item.start,
						item.end,
						item.hash ?? null,
						item.khatm.id,
						item.khatm.seriesId,
						item.khatm.title,
						item.khatm.private,
						serializeSnapshot(item.khatm),
					],
				})
			},

			async getList(limit) {
				const suffix = limitSql(limit)
				return (
					await rows(
						`SELECT id, picked_at, start, end, hash, payload_json
						 FROM picked_khatm_parts ORDER BY picked_at DESC${suffix.sql}`,
						suffix.values,
					)
				).map(pickedFromRow)
			},

			async getByKhatmId(khatmId) {
				return (
					await rows(
						`SELECT id, picked_at, start, end, hash, payload_json
						 FROM picked_khatm_parts WHERE khatm_id = ? ORDER BY picked_at DESC`,
						[khatmId],
					)
				).map(pickedFromRow)
			},

			async getBySeriesId(seriesId) {
				return (
					await rows(
						`SELECT id, picked_at, start, end, hash, payload_json
						 FROM picked_khatm_parts WHERE series_id = ? ORDER BY picked_at DESC`,
						[seriesId],
					)
				).map(pickedFromRow)
			},
		},

		localZekrs: {
			async get(id) {
				const result = await rows(
					'SELECT id, is_mine, my_count, payload_json FROM local_zekrs WHERE id = ?',
					[id],
				)
				return result[0] ? localZekrFromRow(result[0]) : undefined
			},

			async add(item) {
				const now = Date.now()
				await nativeDatabase.execute({
					sql: `INSERT INTO local_zekrs
						(id, title, is_mine, my_count, created_at, updated_at, payload_json, revision)
						VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
					values: [
						item.zekr.id,
						item.zekr.title,
						item.isMine,
						item.myCount,
						epoch(item.zekr.created),
						now,
						serializeSnapshot(item.zekr),
					],
				})
			},

			async getList(limit) {
				const suffix = limitSql(limit)
				return (
					await rows(
						`SELECT id, is_mine, my_count, payload_json FROM local_zekrs
						 WHERE is_mine = 1 ORDER BY created_at DESC${suffix.sql}`,
						suffix.values,
					)
				).map(localZekrFromRow)
			},

			async increaseMyCount(zekr, count) {
				const now = Date.now()
				await nativeDatabase.transaction({
					statements: [
						{
							sql: `INSERT OR IGNORE INTO local_zekrs
								(id, title, is_mine, my_count, created_at, updated_at, payload_json, revision)
								VALUES (?, ?, 0, 0, ?, ?, ?, 0)`,
							values: [
								zekr.id,
								zekr.title,
								epoch(zekr.created),
								now,
								serializeSnapshot(zekr),
							],
						},
						{
							sql: `UPDATE local_zekrs SET title = ?, my_count = my_count + ?,
								updated_at = ?, payload_json = ?, revision = revision + 1 WHERE id = ?`,
							values: [zekr.title, count, now, serializeSnapshot(zekr), zekr.id],
						},
					],
				})
			},
		},

		offlineKhatms: {
			async create(input) {
				const normalized = normalizeOfflineKhatmInput(input)
				const now = new Date()
				const khatm: OfflineKhatmRecord = {
					id: uuid(),
					...normalized,
					seriesStopped: false,
					roundNumber: 1,
					roundCreated: now,
					status: 'inProgress',
					versesRead: 0,
					pageProgress: 0,
					created: now,
					updated: now,
					endDate: null,
					completedRounds: [],
				}
				await nativeDatabase.execute({
					sql: `INSERT INTO offline_khatms
						(id, title, description, range_type, series, series_stopped, round_number,
						 round_created, status, verses_read, page_progress, created_at, updated_at,
						 end_date, completed_rounds_json, revision)
						VALUES (?, ?, ?, ?, ?, 0, 1, ?, 'inProgress', 0, 0, ?, ?, NULL, ?, 0)`,
					values: [
						khatm.id,
						khatm.title,
						khatm.description,
						khatm.rangeType,
						khatm.series,
						now.getTime(),
						now.getTime(),
						now.getTime(),
						serializeRounds([]),
					],
				})
				return khatm
			},

			async get(id) {
				return (await getOfflineRow(id)).record
			},

			async getList() {
				return (await rows(`${offlineSelect} ORDER BY updated_at DESC`)).map(
					(row) => offlineFromRow(row).record,
				)
			},

			async getParts(id, roundNumber) {
				const round = roundNumber ?? (await getOfflineRow(id)).record.roundNumber
				return getOfflineParts(id, round)
			},

			async update(id, input) {
				const normalized = normalizeOfflineKhatmInput({ ...input, series: false })
				const current = await getOfflineRow(id)
				if (current.record.versesRead > 0 && current.record.rangeType !== normalized.rangeType) {
					throw new OfflineKhatmRangeLockedError(
						'پس از شروع ختم، نوع تقسیم قابل تغییر نیست.',
					)
				}
				const updated = new Date()
				const result = await nativeDatabase.execute({
					sql: `UPDATE offline_khatms SET title = ?, description = ?, range_type = ?,
						updated_at = ?, revision = revision + 1 WHERE id = ? AND revision = ?`,
					values: [
						normalized.title,
						normalized.description,
						normalized.rangeType,
						updated.getTime(),
						id,
						current.revision,
					],
				})
				if (!result.changes) throw new Error('Offline khatm was changed concurrently.')
				return {
					...current.record,
					title: normalized.title,
					description: normalized.description,
					rangeType: normalized.rangeType,
					updated,
				}
			},

			async pickRange(id, range) {
				if (
					!Number.isInteger(range.start) ||
					!Number.isInteger(range.end) ||
					range.start < 0 ||
					range.end > COUNT_OF_AYAHS ||
					range.start >= range.end
				) {
					throw new Error('بازهٔ انتخاب‌شده معتبر نیست.')
				}

				const current = await getOfflineRow(id)
				if (current.record.status === 'completed') {
					throw new Error('این دور از ختم کامل شده است.')
				}
				const parts = await getOfflineParts(id, current.record.roundNumber)
				if (parts.some((part) => offlineKhatmRangesOverlap(part, range))) {
					throw new OfflineKhatmConflictError('این بازه قبلاً خوانده شده است.')
				}

				const now = new Date()
				const part: OfflineKhatmPartRecord = {
					id: uuid(),
					khatmId: id,
					roundNumber: current.record.roundNumber,
					start: range.start,
					end: range.end,
					created: now,
				}
				const progress = calculateOfflineKhatmProgress([...parts, part])
				const completed = progress.versesRead >= COUNT_OF_AYAHS
				const completedRounds = completed
					? [
							...current.record.completedRounds.filter(
								(round) => round.roundNumber !== current.record.roundNumber,
							),
							{
								roundNumber: current.record.roundNumber,
								created: current.record.roundCreated,
								completed: now,
							},
						]
					: current.record.completedRounds

				const transaction = await nativeDatabase.transaction({
					statements: [
						{
							sql: `INSERT INTO offline_khatm_parts
								(id, khatm_id, round_number, start, end, created_at)
								SELECT ?, ?, ?, ?, ?, ?
								WHERE EXISTS (
									SELECT 1 FROM offline_khatms
									WHERE id = ? AND revision = ? AND status <> 'completed'
								)
								AND NOT EXISTS (
									SELECT 1 FROM offline_khatm_parts
									WHERE khatm_id = ? AND round_number = ? AND start < ? AND ? < end
								)`,
							values: [
								part.id,
								id,
								part.roundNumber,
								part.start,
								part.end,
								now.getTime(),
								id,
								current.revision,
								id,
								part.roundNumber,
								part.end,
								part.start,
							],
						},
						{
							sql: `UPDATE offline_khatms SET verses_read = ?, page_progress = ?,
								updated_at = ?, status = ?, end_date = ?, completed_rounds_json = ?,
								revision = revision + 1
								WHERE id = ? AND revision = ?
								AND EXISTS (SELECT 1 FROM offline_khatm_parts WHERE id = ?)`,
							values: [
								progress.versesRead,
								progress.pageProgress,
								now.getTime(),
								completed ? 'completed' : 'inProgress',
								completed ? now.getTime() : null,
								serializeRounds(completedRounds),
								id,
								current.revision,
								part.id,
							],
						},
					],
				})
				if (!changes(transaction.results[0]) || !changes(transaction.results[1])) {
					const latestParts = await getOfflineParts(id, current.record.roundNumber)
					if (latestParts.some((item) => offlineKhatmRangesOverlap(item, range))) {
						throw new OfflineKhatmConflictError('این بازه قبلاً خوانده شده است.')
					}
					throw new Error('Offline khatm was changed concurrently.')
				}

				return {
					part,
					khatm: {
						...current.record,
						...progress,
						updated: now,
						status: completed ? 'completed' : 'inProgress',
						endDate: completed ? now : null,
						completedRounds,
					},
				}
			},

			async pickNextAyat(id, count) {
				const current = (await getOfflineRow(id)).record
				if (current.rangeType !== 'ayah') throw new Error('این ختم از نوع آیه‌ای نیست.')
				const safeCount = Math.max(1, Math.min(1000, Math.floor(count)))
				const start = Math.min(current.versesRead, COUNT_OF_AYAHS)
				const range = new QuranRange(start, Math.min(COUNT_OF_AYAHS, start + safeCount))
				if (!range.length) throw new Error('این دور از ختم کامل شده است.')
				return { ...(await this.pickRange(id, range)), range }
			},

			async startNextRound(id) {
				const current = await getOfflineRow(id)
				if (
					!current.record.series ||
					current.record.seriesStopped ||
					current.record.status !== 'completed'
				) {
					throw new Error('شروع دور جدید برای این ختم ممکن نیست.')
				}
				const now = new Date()
				const result = await nativeDatabase.execute({
					sql: `UPDATE offline_khatms SET round_number = round_number + 1,
						round_created = ?, status = 'inProgress', verses_read = 0, page_progress = 0,
						updated_at = ?, end_date = NULL, revision = revision + 1
						WHERE id = ? AND revision = ? AND status = 'completed'`,
					values: [now.getTime(), now.getTime(), id, current.revision],
				})
				if (!result.changes) throw new Error('Offline khatm was changed concurrently.')
				return {
					...current.record,
					roundNumber: current.record.roundNumber + 1,
					roundCreated: now,
					status: 'inProgress',
					versesRead: 0,
					pageProgress: 0,
					updated: now,
					endDate: null,
				}
			},

			async stopSeries(id) {
				const current = await getOfflineRow(id)
				if (!current.record.series) return current.record
				const updated = new Date()
				const result = await nativeDatabase.execute({
					sql: `UPDATE offline_khatms SET series_stopped = 1, updated_at = ?,
						revision = revision + 1 WHERE id = ? AND revision = ?`,
					values: [updated.getTime(), id, current.revision],
				})
				if (!result.changes) throw new Error('Offline khatm was changed concurrently.')
				return { ...current.record, seriesStopped: true, updated }
			},

			async delete(id) {
				await nativeDatabase.execute({ sql: 'DELETE FROM offline_khatms WHERE id = ?', values: [id] })
			},
		},
	}
}
