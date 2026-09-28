package ir.dorkhani.app;

import android.database.Cursor;
import android.database.sqlite.SQLiteCursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteProgram;
import android.database.sqlite.SQLiteStatement;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "NativeDatabase")
public class NativeDatabasePlugin extends Plugin {
    private static final int API_VERSION = 1;
    private static final Pattern FORBIDDEN_SQL = Pattern.compile(
        "(?is)(\\bATTACH\\b|\\bDETACH\\b|\\bVACUUM\\b.*\\bINTO\\b|\\bLOAD_EXTENSION\\s*\\(|" +
        "\\bPRAGMA\\s+WRITABLE_SCHEMA\\b)"
    );
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void handleOnDestroy() {
        executor.shutdown();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void getCapabilities(PluginCall call) {
        executor.execute(() -> {
            try {
                SQLiteDatabase db = AppDatabase.get(getContext()).getReadableDatabase();
                String sqliteVersion = "unknown";
                try (Cursor cursor = db.rawQuery("SELECT sqlite_version()", null)) {
                    if (cursor.moveToFirst()) sqliteVersion = cursor.getString(0);
                }
                JSObject result = new JSObject();
                result.put("apiVersion", API_VERSION);
                result.put("nativeSchemaVersion", AppDatabase.DATABASE_VERSION);
                result.put("sqliteVersion", sqliteVersion);
                call.resolve(result);
            } catch (Exception error) {
                reject(call, "SQLITE_CAPABILITIES", error, null);
            }
        });
    }

    @PluginMethod
    public void execute(PluginCall call) {
        executor.execute(() -> {
            try {
                StatementInput input = parseStatement(call.getData(), false);
                JSObject result = executeStatement(
                    AppDatabase.get(getContext()).getWritableDatabase(),
                    input
                );
                ActivityWidgetUpdater.refreshAll(getContext());
                call.resolve(result);
            } catch (Exception error) {
                reject(call, "SQLITE_EXECUTE", error, null);
            }
        });
    }

    @PluginMethod
    public void query(PluginCall call) {
        executor.execute(() -> {
            try {
                StatementInput input = parseStatement(call.getData(), true);
                call.resolve(queryStatement(AppDatabase.get(getContext()).getReadableDatabase(), input));
            } catch (Exception error) {
                reject(call, "SQLITE_QUERY", error, null);
            }
        });
    }

    @PluginMethod
    public void transaction(PluginCall call) {
        JSArray statements = call.getArray("statements");
        if (statements == null || statements.length() == 0) {
            call.reject("At least one SQL statement is required.", "SQLITE_INVALID_INPUT");
            return;
        }
        executor.execute(() -> {
            int statementIndex = -1;
            try {
                SQLiteDatabase db = AppDatabase.get(getContext()).getWritableDatabase();
                JSONArray results = new JSONArray();
                db.beginTransaction();
                try {
                    for (int index = 0; index < statements.length(); index++) {
                        statementIndex = index;
                        JSONObject raw = statements.getJSONObject(index);
                        StatementInput input = parseStatement(new JSObject(raw.toString()), false);
                        results.put(
                            "rows".equals(input.result)
                                ? queryStatement(db, input)
                                : executeStatement(db, input)
                        );
                    }
                    db.setTransactionSuccessful();
                } finally {
                    db.endTransaction();
                }
                JSObject response = new JSObject();
                response.put("results", results);
                ActivityWidgetUpdater.refreshAll(getContext());
                call.resolve(response);
            } catch (Exception error) {
                JSObject data = new JSObject();
                data.put("statementIndex", statementIndex);
                reject(call, "SQLITE_TRANSACTION", error, data);
            }
        });
    }

    private StatementInput parseStatement(JSObject data, boolean forceRows) throws JSONException {
        String sql = data.getString("sql", "").trim();
        if (sql.isEmpty()) throw new IllegalArgumentException("SQL is required.");
        sql = validateSingleStatement(sql);
        JSONArray values = data.optJSONArray("values");
        if (data.has("values") && !data.isNull("values") && values == null) {
            throw new IllegalArgumentException("SQL values must be an array.");
        }
        String result = forceRows ? "rows" : data.getString("result", "changes");
        if (!"changes".equals(result) && !"rows".equals(result)) {
            throw new IllegalArgumentException("Statement result must be changes or rows.");
        }
        String firstWord = sql.trim().split("\\s+", 2)[0].toUpperCase(Locale.ROOT);
        if ("rows".equals(result)) {
            if (
                !"SELECT".equals(firstWord) &&
                !"WITH".equals(firstWord) &&
                !"EXPLAIN".equals(firstWord) &&
                !"PRAGMA".equals(firstWord)
            ) {
                throw new IllegalArgumentException("Row statements must be SELECT, WITH, EXPLAIN, or PRAGMA.");
            }
        } else if ("SELECT".equals(firstWord) || "EXPLAIN".equals(firstWord)) {
            throw new IllegalArgumentException("Queries must request rows.");
        }
        return new StatementInput(sql, values == null ? new JSONArray() : values, result);
    }

    static String validateSingleStatement(String sql) {
        if (sql.contains("--") || sql.contains("/*") || sql.contains("*/")) {
            throw new IllegalArgumentException("SQL comments are not supported.");
        }
        if (sql.endsWith(";")) sql = sql.substring(0, sql.length() - 1).trim();
        if (sql.contains(";")) {
            throw new IllegalArgumentException("Only one SQL statement is allowed per item.");
        }
        String securityNormalized = sql
            .replace("\"", "")
            .replace("`", "")
            .replace("[", "")
            .replace("]", "");
        if (FORBIDDEN_SQL.matcher(securityNormalized).find()) {
            throw new SecurityException("This SQL operation is not allowed.");
        }
        return sql;
    }

    private JSObject executeStatement(SQLiteDatabase db, StatementInput input) throws JSONException {
        try (SQLiteStatement statement = db.compileStatement(input.sql)) {
            bind(statement, input.values);
            statement.execute();
        }
        long changed = 0;
        long inserted = 0;
        try (Cursor cursor = db.rawQuery("SELECT changes(), last_insert_rowid()", null)) {
            if (cursor.moveToFirst()) {
                changed = cursor.getLong(0);
                inserted = cursor.getLong(1);
            }
        }
        String firstWord = input.sql.trim().split("\\s+", 2)[0].toUpperCase(Locale.ROOT);
        JSObject result = new JSObject();
        result.put("changes", changed);
        result.put(
            "lastInsertRowId",
            changed > 0 && ("INSERT".equals(firstWord) || "REPLACE".equals(firstWord))
                ? inserted
                : JSONObject.NULL
        );
        return result;
    }

    private JSObject queryStatement(SQLiteDatabase db, StatementInput input) throws JSONException {
        try (
            Cursor cursor = db.rawQueryWithFactory(
                (database, driver, editTable, query) -> {
                    try {
                        bind(query, input.values);
                    } catch (JSONException error) {
                        throw new IllegalArgumentException("Invalid SQL bind value.", error);
                    }
                    return new SQLiteCursor(driver, editTable, query);
                },
                input.sql,
                new String[0],
                null
            )
        ) {
            JSONArray columns = new JSONArray();
            for (String column : cursor.getColumnNames()) columns.put(column);
            JSONArray rows = new JSONArray();
            while (cursor.moveToNext()) {
                JSObject row = new JSObject();
                for (int index = 0; index < cursor.getColumnCount(); index++) {
                    switch (cursor.getType(index)) {
                        case Cursor.FIELD_TYPE_NULL:
                            row.put(cursor.getColumnName(index), JSONObject.NULL);
                            break;
                        case Cursor.FIELD_TYPE_INTEGER:
                            row.put(cursor.getColumnName(index), cursor.getLong(index));
                            break;
                        case Cursor.FIELD_TYPE_FLOAT:
                            row.put(cursor.getColumnName(index), cursor.getDouble(index));
                            break;
                        case Cursor.FIELD_TYPE_BLOB:
                            JSObject blob = new JSObject();
                            blob.put(
                                "base64",
                                Base64.encodeToString(cursor.getBlob(index), Base64.NO_WRAP)
                            );
                            row.put(cursor.getColumnName(index), blob);
                            break;
                        default:
                            row.put(cursor.getColumnName(index), cursor.getString(index));
                    }
                }
                rows.put(row);
            }
            JSObject result = new JSObject();
            result.put("columns", columns);
            result.put("rows", rows);
            return result;
        }
    }

    private void bind(SQLiteProgram statement, JSONArray values) throws JSONException {
        for (int index = 0; index < values.length(); index++) {
            Object value = values.get(index);
            int bindIndex = index + 1;
            if (value == JSONObject.NULL) statement.bindNull(bindIndex);
            else if (value instanceof Boolean) statement.bindLong(bindIndex, (Boolean) value ? 1 : 0);
            else if (value instanceof Byte || value instanceof Short || value instanceof Integer || value instanceof Long) {
                statement.bindLong(bindIndex, ((Number) value).longValue());
            } else if (value instanceof Number) statement.bindDouble(bindIndex, ((Number) value).doubleValue());
            else if (value instanceof JSONObject && ((JSONObject) value).has("base64")) {
                statement.bindBlob(
                    bindIndex,
                    Base64.decode(((JSONObject) value).getString("base64"), Base64.DEFAULT)
                );
            } else if (value instanceof String) statement.bindString(bindIndex, (String) value);
            else throw new IllegalArgumentException("Unsupported SQL value at index " + index + ".");
        }
    }

    private void reject(PluginCall call, String code, Exception error, JSObject data) {
        String message = error.getMessage() == null ? "Native database operation failed." : error.getMessage();
        call.reject(message, code, error, data);
    }

    private static final class StatementInput {
        final String sql;
        final JSONArray values;
        final String result;

        StatementInput(String sql, JSONArray values, String result) {
            this.sql = sql;
            this.values = values;
            this.result = result;
        }
    }
}
