import sqlite3
from datetime import datetime
from pathlib import Path

from psycopg import sql

from ai_service import load_env_file
from database_postgres import (
    get_db_connection,
    SCHEMA_STATEMENTS,
    INDEX_STATEMENTS,
)

BASE_DIR = Path(__file__).resolve().parent
SQLITE_PATH = BASE_DIR / "skillspring.db"

EXPECTED_TABLES = {
    "users",
    "careers",
    "student_profiles",
    "skills",
    "career_required_skills",
    "user_skills",
    "roadmap_milestones",
    "roadmap_tasks",
    "user_task_progress",
    "user_recommended_projects",
    "user_study_plans",
}

INSERT_ORDER = [
    "users",
    "careers",
    "skills",
    "student_profiles",
    "career_required_skills",
    "roadmap_milestones",
    "roadmap_tasks",
    "user_skills",
    "user_task_progress",
    "user_recommended_projects",
    "user_study_plans",
]


def connect_to_sqlite_read_only():
    """Open the original SQLite database without write access."""
    if not SQLITE_PATH.is_file():
        raise FileNotFoundError("Source SQLite database was not found.")

    uri = SQLITE_PATH.as_uri() + "?mode=ro"
    return sqlite3.connect(uri, uri=True)


def inspect_sqlite_source():
    """Validate source tables and foreign-key integrity."""
    connection = connect_to_sqlite_read_only()

    try:
        tables = {
            row[0]
            for row in connection.execute("""
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name NOT LIKE 'sqlite_%'
            """)
        }

        if tables != EXPECTED_TABLES:
            missing = EXPECTED_TABLES - tables
            unexpected = tables - EXPECTED_TABLES
            raise RuntimeError(
                f"Unexpected SQLite schema. "
                f"Missing: {sorted(missing)}; "
                f"Unexpected: {sorted(unexpected)}"
            )

        violations = connection.execute(
            "PRAGMA foreign_key_check"
        ).fetchall()

        if violations:
            raise RuntimeError(
                f"SQLite foreign-key check failed: {len(violations)} violations."
            )

        counts = {}

        for table in INSERT_ORDER:
            counts[table] = connection.execute(
                f'SELECT COUNT(*) FROM "{table}"'
            ).fetchone()[0]

        return counts

    finally:
        connection.close()


def extract_sqlite_data(connection):
    """Read every source record while preserving column names and values."""
    data = {}

    for table in INSERT_ORDER:
        cursor = connection.execute(f'SELECT * FROM "{table}"')
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()

        converted_rows = []

        for row in rows:
            record = dict(zip(columns, row))

            for column, value in record.items():
                if (
                    isinstance(value, str)
                    and column.endswith("_at")
                ):
                    try:
                        record[column] = datetime.strptime(
                            value, "%Y-%m-%d %H:%M:%S"
                        )
                    except ValueError:
                        pass

            converted_rows.append(record)

        data[table] = (columns, converted_rows)

    return data
def verify_neon_is_empty(connection):
    """Abort if application tables already exist in Neon."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
        """)

        existing_tables = {row["table_name"] for row in cursor.fetchall()}

    if existing_tables:
        raise RuntimeError(
            "Migration stopped: Neon public schema is not empty. "
            f"Existing tables: {sorted(existing_tables)}"
        )

    print("Neon safety check passed: public schema is empty.")
def create_neon_schema(connection):
    """Create the PostgreSQL schema and indexes."""
    with connection.cursor() as cursor:
        for statement in SCHEMA_STATEMENTS:
            cursor.execute(statement)

        for statement in INDEX_STATEMENTS:
            cursor.execute(statement)

    print("PostgreSQL tables and indexes created.")


def insert_migrated_data(connection, data):
    """Insert SQLite records into PostgreSQL in dependency order."""
    total_inserted = {}

    with connection.cursor() as cursor:
        for table in INSERT_ORDER:
            columns, rows = data[table]

            if not rows:
                total_inserted[table] = 0
                continue

            query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                sql.Identifier(table),
                sql.SQL(", ").join(
                    sql.Identifier(column) for column in columns
                ),
                sql.SQL(", ").join(
                    sql.Placeholder() for _ in columns
                ),
            )

            values = [
                tuple(record[column] for column in columns)
                for record in rows
            ]

            cursor.executemany(query, values)
            total_inserted[table] = len(rows)

            print(f"Prepared {table}: {len(rows)} records")

    return total_inserted
def synchronize_identity_sequences(connection):
    """Set identity sequences above the highest migrated ID."""
    identity_tables = [
        "users",
        "student_profiles",
        "skills",
        "career_required_skills",
        "user_skills",
        "roadmap_milestones",
        "user_task_progress",
        "user_recommended_projects",
        "user_study_plans",
    ]

    with connection.cursor() as cursor:
        for table in identity_tables:
            cursor.execute(
                sql.SQL("SELECT MAX(id) AS max_id FROM {}").format(
                    sql.Identifier(table)
                )
            )
            max_id = cursor.fetchone()["max_id"]

            if max_id is None:
                continue

            cursor.execute(
                """
                SELECT setval(
                    pg_get_serial_sequence(%s, 'id'),
                    %s,
                    true
                )
                """,
                (f"public.{table}", max_id),
            )

            print(f"ID sequence synchronized: {table}")

def verify_migrated_data(connection, source_data):
    """Compare every migrated record and column against SQLite."""
    mismatches = []

    with connection.cursor() as cursor:
        for table in INSERT_ORDER:
            columns, source_rows = source_data[table]

            selected_columns = sql.SQL(", ").join(
                sql.Identifier(column) for column in columns
            )

            query = sql.SQL(
                "SELECT {} FROM {} ORDER BY {}"
            ).format(
                selected_columns,
                sql.Identifier(table),
                sql.Identifier("id"),
            )

            cursor.execute(query)
            destination_rows = cursor.fetchall()

            source_by_id = {
                record["id"]: record for record in source_rows
            }
            destination_by_id = {
                record["id"]: record for record in destination_rows
            }

            source_ids = set(source_by_id)
            destination_ids = set(destination_by_id)

            missing_ids = source_ids - destination_ids
            extra_ids = destination_ids - source_ids
            field_mismatches = []

            for record_id in sorted(source_ids & destination_ids, key=str):
                for column in columns:
                    if (
                        source_by_id[record_id][column]
                        != destination_by_id[record_id][column]
                    ):
                        field_mismatches.append((record_id, column))

            if missing_ids or extra_ids or field_mismatches:
                mismatches.append(table)
                print(f"FAIL: {table}")
                print(f"  Missing IDs: {sorted(missing_ids, key=str)[:10]}")
                print(f"  Extra IDs: {sorted(extra_ids, key=str)[:10]}")
                print(f"  Field mismatches: {field_mismatches[:10]}")
            else:
                print(
                    f"PASS: {table} - {len(source_rows)} records, "
                    f"all {len(columns)} columns verified"
                )

    if mismatches:
        raise RuntimeError(
            f"Full data verification failed for: {mismatches}"
        )

    print("PASS: All 11 tables and every record/column match SQLite.")


def run_migration():
    """Run the complete migration as one PostgreSQL transaction."""
    load_env_file()

    print("\nChecking original SQLite database...")
    source_counts = inspect_sqlite_source()

    sqlite_connection = connect_to_sqlite_read_only()

    try:
        data = extract_sqlite_data(sqlite_connection)

        extracted_counts = {
            table: len(data[table][1])
            for table in INSERT_ORDER
        }

        if extracted_counts != source_counts:
            raise RuntimeError(
                "SQLite record counts changed during extraction."
            )

    finally:
        sqlite_connection.close()

    print("\nConnecting to Neon PostgreSQL...")
    connection = get_db_connection()

    try:
        with connection.transaction():
            verify_neon_is_empty(connection)

            create_neon_schema(connection)

            insert_migrated_data(connection, data)

            synchronize_identity_sequences(connection)

            verify_migrated_data(connection, data)

        print("\nSUCCESS: Migration committed.")
        print("All source records were transferred and verified.")

    except Exception:
        print("\nMIGRATION FAILED: PostgreSQL transaction rolled back.")
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    print("SkillSpring SQLite to Neon migration")
    run_migration()
