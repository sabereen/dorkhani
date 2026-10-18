package ir.dorkhani.app;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

public final class ActivityWidgetDao {
    private final SQLiteDatabase database;

    public ActivityWidgetDao(Context context) {
        database = AppDatabase.get(context).getReadableDatabase();
    }

    public Summary getSummary() {
        return new Summary(getOffline(), getCreated(), getPicked(), getZekr());
    }

    private OfflineItem getOffline() {
        try (
            Cursor cursor = database.rawQuery(
                "SELECT title, round_number, page_progress, updated_at FROM offline_khatms " +
                "ORDER BY CASE WHEN status = 'inProgress' THEN 0 ELSE 1 END, updated_at DESC LIMIT 1",
                null
            )
        ) {
            if (!cursor.moveToFirst()) return null;
            return new OfflineItem(
                cursor.getString(0),
                cursor.getInt(1),
                cursor.getDouble(2),
                cursor.getLong(3)
            );
        }
    }

    private CreatedItem getCreated() {
        try (
            Cursor cursor = database.rawQuery(
                "SELECT title, created_at FROM created_khatms ORDER BY created_at DESC LIMIT 1",
                null
            )
        ) {
            if (!cursor.moveToFirst()) return null;
            return new CreatedItem(cursor.getString(0), cursor.getLong(1));
        }
    }

    private PickedItem getPicked() {
        try (
            Cursor cursor = database.rawQuery(
                "SELECT khatm_title, start, end, picked_at FROM picked_khatm_parts " +
                "ORDER BY picked_at DESC LIMIT 1",
                null
            )
        ) {
            if (!cursor.moveToFirst()) return null;
            return new PickedItem(
                cursor.getString(0),
                cursor.getInt(1),
                cursor.getInt(2),
                cursor.getLong(3)
            );
        }
    }

    private ZekrItem getZekr() {
        try (
            Cursor cursor = database.rawQuery(
                "SELECT title, my_count, updated_at FROM local_zekrs " +
                "ORDER BY updated_at DESC LIMIT 1",
                null
            )
        ) {
            if (!cursor.moveToFirst()) return null;
            return new ZekrItem(cursor.getString(0), cursor.getLong(1), cursor.getLong(2));
        }
    }

    public static final class Summary {
        public final OfflineItem offline;
        public final CreatedItem created;
        public final PickedItem picked;
        public final ZekrItem zekr;

        Summary(OfflineItem offline, CreatedItem created, PickedItem picked, ZekrItem zekr) {
            this.offline = offline;
            this.created = created;
            this.picked = picked;
            this.zekr = zekr;
        }

        public boolean isEmpty() {
            return offline == null && created == null && picked == null && zekr == null;
        }
    }

    public static final class OfflineItem {
        public final String title;
        public final int round;
        public final double progress;
        public final long updatedAt;

        OfflineItem(String title, int round, double progress, long updatedAt) {
            this.title = title;
            this.round = round;
            this.progress = progress;
            this.updatedAt = updatedAt;
        }
    }

    public static final class CreatedItem {
        public final String title;
        public final long createdAt;

        CreatedItem(String title, long createdAt) {
            this.title = title;
            this.createdAt = createdAt;
        }
    }

    public static final class PickedItem {
        public final String title;
        public final int start;
        public final int end;
        public final long pickedAt;

        PickedItem(String title, int start, int end, long pickedAt) {
            this.title = title;
            this.start = start;
            this.end = end;
            this.pickedAt = pickedAt;
        }
    }

    public static final class ZekrItem {
        public final String title;
        public final long count;
        public final long updatedAt;

        ZekrItem(String title, long count, long updatedAt) {
            this.title = title;
            this.count = count;
            this.updatedAt = updatedAt;
        }
    }
}
