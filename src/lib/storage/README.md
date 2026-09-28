# Client storage contract

The browser adapter keeps the existing Dexie schema. The Android adapter stores structured
data in `dorkhani.db` and settings in the `dorkhani_preferences` SharedPreferences file. Auth
tokens remain in `@aparajita/capacitor-secure-storage`.

Android SQL is intentionally owned by the JavaScript bundle. `NativeDatabase` exposes
parameterized `query`, `execute`, and atomic batch `transaction` methods. Values must always be
bound through `values`; only identifiers and static SQL syntax belong in the SQL string.

## Compatibility rules

- Every bundle declares its minimum native API and schema versions before running migrations.
- JavaScript migrations are sequential and additive. Do not drop or rename core tables,
  indexes, or columns read by the native widget.
- `storage_metadata.js_schema_version` belongs to JavaScript migrations. Android's database
  version belongs to `SQLiteOpenHelper`; do not change it from JavaScript.
- Writes to records with a `revision` column must increment it and use optimistic conditions
  when based on previously read data.
- `ATTACH`, `DETACH`, `VACUUM INTO`, extension loading, writable schema changes, database path
  selection, and multiple statements in one API item are deliberately unavailable.
- A future in-app updater must verify a bundle's cryptographic signature before executing any
  downloaded JavaScript.

Breaking changes to the widget projection require an APK update that migrates the native
schema before a dependent JavaScript bundle is allowed to run.
