use std::path::Path;
use std::time::Duration;

use rusqlite::{Connection, OpenFlags};

pub mod logs;
#[path = "schema.g.rs"]
pub mod schema;
pub mod settings;

#[derive(Debug)]
pub enum DbError {
    Schema { found: i32, expected: i32 },
    Column { table: String, column: String },
    Sqlite(rusqlite::Error),
}

impl From<rusqlite::Error> for DbError {
    fn from(e: rusqlite::Error) -> Self {
        Self::Sqlite(e)
    }
}

pub struct Db(Connection);

impl Db {
    /// Opens `<dir>/<name>.sqlite`. The file must already exist, carry at least `version` in
    /// `PRAGMA user_version` and have every column in `tables`; nothing is read or written otherwise.
    pub fn open(
        dir: &Path,
        name: &str,
        version: i32,
        tables: &[(&str, &[&str])],
    ) -> Result<Db, DbError> {
        let conn = Connection::open_with_flags(
            dir.join(format!("{name}.sqlite")),
            OpenFlags::SQLITE_OPEN_READ_WRITE,
        )?;
        conn.busy_timeout(Duration::from_secs(5))?;
        Db::check(conn, version, tables)
    }

    fn check(conn: Connection, expected: i32, tables: &[(&str, &[&str])]) -> Result<Db, DbError> {
        let found = conn.query_row("PRAGMA user_version", [], |row| row.get(0))?;
        if found < expected {
            return Err(DbError::Schema { found, expected });
        }
        for (table, columns) in tables {
            let mut names = Vec::new();
            conn.pragma(None, "table_info", table, |row| {
                names.push(row.get::<_, String>(1)?);
                Ok(())
            })?;
            if let Some(column) = columns.iter().find(|c| !names.iter().any(|n| n == *c)) {
                return Err(DbError::Column {
                    table: table.to_string(),
                    column: column.to_string(),
                });
            }
        }
        Ok(Db(conn))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use schema::{LOGS_SCHEMA_VERSION, logger_messages};

    const LOGS_TABLES: &[(&str, &[&str])] = &[(logger_messages::TABLE, logger_messages::COLUMNS)];

    fn memory(sql: &str, version: i32) -> Result<Connection, DbError> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch(sql)?;
        conn.pragma_update(None, "user_version", version)?;
        Ok(conn)
    }

    #[test]
    fn version_is_a_floor() -> Result<(), DbError> {
        let older = memory(logger_messages::SQL, LOGS_SCHEMA_VERSION - 1)?;
        assert!(matches!(
            Db::check(older, LOGS_SCHEMA_VERSION, LOGS_TABLES),
            Err(DbError::Schema { found, expected })
                if found == LOGS_SCHEMA_VERSION - 1 && expected == LOGS_SCHEMA_VERSION
        ));
        let newer = memory(logger_messages::SQL, LOGS_SCHEMA_VERSION + 1)?;
        Db::check(newer, LOGS_SCHEMA_VERSION, LOGS_TABLES)?;
        Ok(())
    }

    #[test]
    fn missing_column_is_refused() -> Result<(), DbError> {
        let conn = memory(
            "create table logger_messages (id integer primary key)",
            LOGS_SCHEMA_VERSION,
        )?;
        assert!(matches!(
            Db::check(conn, LOGS_SCHEMA_VERSION, LOGS_TABLES),
            Err(DbError::Column { table, column })
                if table == "logger_messages" && column == "message"
        ));
        Ok(())
    }
}
