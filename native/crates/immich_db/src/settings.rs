use rusqlite::OptionalExtension;

use crate::schema::settings::{KEY, TABLE, VALUE};
use crate::schema::{LOG_LEVEL_SETTING, LogLevel};
use crate::{Db, DbError};

pub fn log_level(db: &Db) -> Result<Option<LogLevel>, DbError> {
    let name: Option<Option<String>> =
        db.0.query_row(
            &format!("select {VALUE} from {TABLE} where {KEY} = ?1"),
            [LOG_LEVEL_SETTING],
            |row| row.get(0),
        )
        .optional()?;
    Ok(name.flatten().and_then(|name| LogLevel::from_name(&name)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::schema::{MAIN_SCHEMA_VERSION, settings};
    use rusqlite::Connection;

    #[test]
    fn log_level_reads_the_setting() -> Result<(), DbError> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch(settings::SQL)?;
        conn.pragma_update(None, "user_version", MAIN_SCHEMA_VERSION)?;
        let db = Db::check(
            conn,
            MAIN_SCHEMA_VERSION,
            &[(settings::TABLE, settings::COLUMNS)],
        )?;
        assert_eq!(log_level(&db)?, None);
        db.0.execute(
            "insert into settings (key, value) values (?1, 'severe')",
            [LOG_LEVEL_SETTING],
        )?;
        assert_eq!(log_level(&db)?, Some(LogLevel::Severe));
        db.0.execute("update settings set value = 'loud'", [])?;
        assert_eq!(log_level(&db)?, None);
        Ok(())
    }
}
