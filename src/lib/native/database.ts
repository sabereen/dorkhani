import { registerPlugin } from '@capacitor/core'

export type SqlBlob = { base64: string }
export type SqlValue = null | string | number | boolean | SqlBlob

export type SqlStatement = {
	sql: string
	values?: SqlValue[]
	result?: 'changes' | 'rows'
}

export type SqlChangesResult = {
	changes: number
	lastInsertRowId: number | null
}

export type SqlRowsResult = {
	columns: string[]
	rows: Array<Record<string, SqlValue>>
}

export interface NativeDatabasePlugin {
	getCapabilities(): Promise<{
		apiVersion: number
		nativeSchemaVersion: number
		sqliteVersion: string
	}>
	execute(input: SqlStatement): Promise<SqlChangesResult>
	query(input: SqlStatement): Promise<SqlRowsResult>
	transaction(input: {
		statements: SqlStatement[]
	}): Promise<{ results: Array<SqlChangesResult | SqlRowsResult> }>
}

export const nativeDatabase = registerPlugin<NativeDatabasePlugin>('NativeDatabase')
