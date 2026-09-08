use rusqlite::params;

use crate::schema::LogLevel;
use crate::{Db, DbError};

pub struct Record<'a> {
    pub level: LogLevel,
    pub logger: &'a str,
    pub message: &'a str,
    pub details: Option<&'a str>,
}

pub fn write(db: &Db, record: &Record<'_>) -> Result<(), DbError> {
    use crate::schema::logger_messages::{
        CREATED_AT, DETAILS, LEVEL, LOGGER, MESSAGE, STACK, TABLE,
    };
    let created_at = created_at_sql();
    let sql = format!(
        "insert into {TABLE} ({MESSAGE}, {DETAILS}, {LEVEL}, {CREATED_AT}, {LOGGER}, {STACK}) \
         values (?1, ?2, ?3, {created_at}, ?4, null)"
    );
    db.0.execute(
        &sql,
        params![
            record.message,
            record.details,
            record.level as i64,
            record.logger
        ],
    )?;
    Ok(())
}

fn created_at_sql() -> String {
    let seconds = "(strftime('%s', 'now', 'localtime') - strftime('%s', 'now'))";
    format!(
        "strftime('%Y-%m-%dT%H:%M:%f', 'now', 'localtime') || ' ' || {}",
        offset_sql(seconds)
    )
}

fn offset_sql(seconds: &str) -> String {
    format!(
        "printf('%s%02d:%02d', case when {seconds} < 0 then '-' else '+' end, abs({seconds}) / 3600, abs({seconds}) % 3600 / 60)"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::schema::{LOGS_SCHEMA_VERSION, logger_messages};
    use rusqlite::Connection;

    #[test]
    fn write_roundtrips() -> Result<(), DbError> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch(logger_messages::SQL)?;
        conn.pragma_update(None, "user_version", LOGS_SCHEMA_VERSION)?;
        let db = Db::check(conn, LOGS_SCHEMA_VERSION, &[])?;
        write(
            &db,
            &Record {
                level: LogLevel::Info,
                logger: "BackgroundWorker",
                message: "Starting background upload worker",
                details: None,
            },
        )?;
        let (message, level, created_at, logger, nulls): (String, i64, String, String, bool) = db
            .0
            .query_row(
                "select message, level, created_at, logger, details is null and stack is null from logger_messages",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
            )?;
        assert_eq!(
            (message.as_str(), level, logger.as_str(), nulls),
            (
                "Starting background upload worker",
                5, // drift's LogLevel.info index
                "BackgroundWorker",
                true
            )
        );
        let shape = "0000-00-00T00:00:00.000 +00:00";
        let matches = created_at.len() == shape.len()
            && created_at.chars().zip(shape.chars()).all(|(c, s)| match s {
                '0' => c.is_ascii_digit(),
                '+' => c == '+' || c == '-',
                _ => c == s,
            });
        assert!(matches, "{created_at}");
        write(
            &db,
            &Record {
                level: LogLevel::Severe,
                logger: "BackgroundWorker",
                message: "Failed to start engine",
                details: Some("engine unavailable"),
            },
        )?;
        let details: String = db.0.query_row(
            "select details from logger_messages where level = ?1",
            [LogLevel::Severe as i64],
            |r| r.get(0),
        )?;
        assert_eq!(details, "engine unavailable");
        Ok(())
    }

    #[test]
    fn offset_text_has_sign_and_half_hours() -> Result<(), DbError> {
        let conn = Connection::open_in_memory()?;
        for (seconds, text) in [(19800, "+05:30"), (0, "+00:00"), (-1800, "-00:30")] {
            let sql = format!("select {}", offset_sql(&seconds.to_string()));
            let got: String = conn.query_row(&sql, [], |r| r.get(0))?;
            assert_eq!(got, text);
        }
        Ok(())
    }
}
