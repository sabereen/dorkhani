package ir.dorkhani.app;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public final class AppDatabase extends SQLiteOpenHelper {
    public static final String DATABASE_NAME = "dorkhani.db";
    public static final int DATABASE_VERSION = 1;

    private static volatile AppDatabase instance;

    public static AppDatabase get(Context context) {
        if (instance == null) {
            synchronized (AppDatabase.class) {
                if (instance == null) {
                    instance = new AppDatabase(context.getApplicationContext());
                }
            }
        }
        return instance;
    }

    private AppDatabase(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onConfigure(SQLiteDatabase db) {
        super.onConfigure(db);
        db.setForeignKeyConstraintsEnabled(true);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(
            "CREATE TABLE storage_metadata (" +
            "key TEXT PRIMARY KEY NOT NULL, " +
            "value TEXT NOT NULL)"
        );
        db.execSQL(
            "CREATE TABLE created_khatms (" +
            "id INTEGER PRIMARY KEY NOT NULL, " +
            "title TEXT NOT NULL, " +
            "created_at INTEGER NOT NULL, " +
            "series_id INTEGER, " +
            "is_private INTEGER NOT NULL, " +
            "claim_token TEXT, " +
            "payload_json TEXT NOT NULL, " +
            "revision INTEGER NOT NULL DEFAULT 0)"
        );
        db.execSQL(
            "CREATE TABLE picked_khatm_parts (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "picked_at INTEGER NOT NULL, " +
            "start INTEGER NOT NULL, " +
            "end INTEGER NOT NULL, " +
            "hash TEXT, " +
            "khatm_id INTEGER NOT NULL, " +
            "series_id INTEGER, " +
            "khatm_title TEXT NOT NULL, " +
            "is_private INTEGER NOT NULL, " +
            "payload_json TEXT NOT NULL)"
        );
        db.execSQL(
            "CREATE TABLE local_zekrs (" +
            "id INTEGER PRIMARY KEY NOT NULL, " +
            "title TEXT NOT NULL, " +
            "is_mine INTEGER NOT NULL, " +
            "my_count INTEGER NOT NULL, " +
            "created_at INTEGER NOT NULL, " +
            "updated_at INTEGER NOT NULL, " +
            "payload_json TEXT NOT NULL, " +
            "revision INTEGER NOT NULL DEFAULT 0)"
        );
        db.execSQL(
            "CREATE TABLE offline_khatms (" +
            "id TEXT PRIMARY KEY NOT NULL, " +
            "title TEXT NOT NULL, " +
            "description TEXT NOT NULL, " +
            "range_type TEXT NOT NULL, " +
            "series INTEGER NOT NULL, " +
            "series_stopped INTEGER NOT NULL, " +
            "round_number INTEGER NOT NULL, " +
            "round_created INTEGER NOT NULL, " +
            "status TEXT NOT NULL, " +
            "verses_read INTEGER NOT NULL, " +
            "page_progress REAL NOT NULL, " +
            "created_at INTEGER NOT NULL, " +
            "updated_at INTEGER NOT NULL, " +
            "end_date INTEGER, " +
            "completed_rounds_json TEXT NOT NULL, " +
            "revision INTEGER NOT NULL DEFAULT 0)"
        );
        db.execSQL(
            "CREATE TABLE offline_khatm_parts (" +
            "id TEXT PRIMARY KEY NOT NULL, " +
            "khatm_id TEXT NOT NULL, " +
            "round_number INTEGER NOT NULL, " +
            "start INTEGER NOT NULL, " +
            "end INTEGER NOT NULL, " +
            "created_at INTEGER NOT NULL, " +
            "FOREIGN KEY(khatm_id) REFERENCES offline_khatms(id) ON DELETE CASCADE)"
        );

        db.execSQL("CREATE INDEX created_khatms_created_idx ON created_khatms(created_at)");
        db.execSQL("CREATE INDEX created_khatms_series_idx ON created_khatms(series_id)");
        db.execSQL("CREATE INDEX picked_parts_date_idx ON picked_khatm_parts(picked_at)");
        db.execSQL("CREATE INDEX picked_parts_khatm_idx ON picked_khatm_parts(khatm_id)");
        db.execSQL("CREATE INDEX picked_parts_series_idx ON picked_khatm_parts(series_id)");
        db.execSQL("CREATE INDEX local_zekrs_created_idx ON local_zekrs(created_at)");
        db.execSQL("CREATE INDEX local_zekrs_updated_idx ON local_zekrs(updated_at)");
        db.execSQL("CREATE INDEX offline_khatms_updated_idx ON offline_khatms(updated_at)");
        db.execSQL(
            "CREATE INDEX offline_parts_round_idx ON offline_khatm_parts(khatm_id, round_number, start)"
        );
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Future versions must use incremental, non-destructive migrations here.
    }
}
