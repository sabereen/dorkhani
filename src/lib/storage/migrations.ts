import { nativeDatabase, type SqlStatement } from '$lib/native/database'

export type NativeStorageMigration = {
	version: number
	statements: SqlStatement[]
}

export type NativeStorageManifest = {
	minimumNativeApiVersion: number
	minimumNativeSchemaVersion: number
	migrations: NativeStorageMigration[]
}

const destructiveSchemaChange = /\b(?:DROP\s+(?:TABLE|INDEX)|ALTER\s+TABLE\s+\S+\s+(?:DROP|RENAME))\b/i

export async function runNativeStorageMigrations(manifest: NativeStorageManifest) {
	const capabilities = await nativeDatabase.getCapabilities()
	if (
		capabilities.apiVersion < manifest.minimumNativeApiVersion ||
		capabilities.nativeSchemaVersion < manifest.minimumNativeSchemaVersion
	) {
		throw new Error('The installed Android storage API is not compatible with this app.')
	}

	const versionResult = await nativeDatabase.query({
		sql: `SELECT value FROM storage_metadata WHERE key = ?`,
		values: ['js_schema_version'],
	})
	let currentVersion = Number(versionResult.rows[0]?.value ?? 0)
	const migrations = [...manifest.migrations].sort((a, b) => a.version - b.version)

	for (const migration of migrations) {
		if (!Number.isInteger(migration.version) || migration.version <= 0) {
			throw new Error('Native storage migration versions must be positive integers.')
		}
		if (migration.version <= currentVersion) continue
		if (migration.version !== currentVersion + 1) {
			throw new Error(`Missing native storage migration ${currentVersion + 1}.`)
		}
		if (migration.statements.some((statement) => destructiveSchemaChange.test(statement.sql))) {
			throw new Error('JavaScript storage migrations must preserve the native widget schema.')
		}
		await nativeDatabase.transaction({
			statements: [
				...migration.statements,
				{
					sql: `INSERT OR REPLACE INTO storage_metadata(key, value) VALUES(?, ?)`,
					values: ['js_schema_version', String(migration.version)],
				},
			],
		})
		currentVersion = migration.version
	}

	return { ...capabilities, jsSchemaVersion: currentVersion }
}
