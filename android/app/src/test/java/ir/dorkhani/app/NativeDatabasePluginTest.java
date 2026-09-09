package ir.dorkhani.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import org.junit.Test;

public class NativeDatabasePluginTest {
    @Test
    public void acceptsOneParameterizedStatement() {
        assertEquals(
            "UPDATE local_zekrs SET my_count = ? WHERE id = ?",
            NativeDatabasePlugin.validateSingleStatement(
                "UPDATE local_zekrs SET my_count = ? WHERE id = ?;"
            )
        );
    }

    @Test
    public void rejectsMultipleAndDangerousStatements() {
        assertThrows(
            IllegalArgumentException.class,
            () -> NativeDatabasePlugin.validateSingleStatement("SELECT 1; DELETE FROM local_zekrs")
        );
        assertThrows(
            SecurityException.class,
            () -> NativeDatabasePlugin.validateSingleStatement("ATTACH DATABASE ? AS external")
        );
        assertThrows(
            SecurityException.class,
            () -> NativeDatabasePlugin.validateSingleStatement("PRAGMA writable_schema = ON")
        );
    }
}
