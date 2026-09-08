use std::ffi::{CStr, c_char};
use std::path::Path;

use immich_db::logs::{self, Record};
use immich_db::schema::{self, LOGS_SCHEMA_VERSION, LogLevel, MAIN_SCHEMA_VERSION};
use immich_db::{Db, settings};

use super::guard;

#[repr(i32)]
pub enum ImmichCoreLogLevel {
    Info = 0,
    Warning = 1,
    Severe = 2,
}

/// Writes one app log entry unless it is below the app's log level setting.
/// Returns zero on success, nonzero on failure.
///
/// # Safety
/// String pointers must be null or valid NUL-terminated strings.
/// `level` must be a valid `ImmichCoreLogLevel` variant.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn immich_core_log(
    app_dir: *const c_char,
    level: ImmichCoreLogLevel,
    logger: *const c_char,
    message: *const c_char,
) -> i32 {
    guard(1, || {
        if app_dir.is_null() || logger.is_null() || message.is_null() {
            return 1;
        }
        // SAFETY: pointers are non-null; the caller guarantees valid NUL-terminated strings.
        let (dir, logger, message) = unsafe {
            (
                CStr::from_ptr(app_dir),
                CStr::from_ptr(logger),
                CStr::from_ptr(message),
            )
        };
        match (dir.to_str(), logger.to_str(), message.to_str()) {
            (Ok(dir), Ok(logger), Ok(message)) => log(dir, level, logger, message),
            _ => 1,
        }
    })
}

pub(super) fn log(dir: &str, level: ImmichCoreLogLevel, logger: &str, message: &str) -> i32 {
    let level = match level {
        ImmichCoreLogLevel::Info => LogLevel::Info,
        ImmichCoreLogLevel::Warning => LogLevel::Warning,
        ImmichCoreLogLevel::Severe => LogLevel::Severe,
    };
    let dir = Path::new(dir);
    let threshold = match Db::open(
        dir,
        "immich",
        MAIN_SCHEMA_VERSION,
        &[(schema::settings::TABLE, schema::settings::COLUMNS)],
    )
    .and_then(|db| settings::log_level(&db))
    {
        Ok(Some(threshold)) => threshold,
        // No row means the default level, and an unreadable setting is treated the same.
        _ => LogLevel::Info,
    };
    if level < threshold {
        return 0;
    }
    let result = Db::open(
        dir,
        "immich_logs",
        LOGS_SCHEMA_VERSION,
        &[(
            schema::logger_messages::TABLE,
            schema::logger_messages::COLUMNS,
        )],
    )
    .and_then(|db| {
        logs::write(
            &db,
            &Record {
                level,
                logger,
                message,
                details: None,
            },
        )
    });
    i32::from(result.is_err())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::error::Error;
    use std::ffi::CString;
    use std::path::PathBuf;

    fn temp_dir(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let dir =
            std::env::temp_dir().join(format!("immich_core_ffi_{name}_{}", std::process::id()));
        std::fs::create_dir(&dir)?;
        Ok(dir)
    }

    fn create(
        dir: &Path,
        name: &str,
        sql: &str,
        version: i32,
    ) -> Result<Connection, Box<dyn Error>> {
        let conn = Connection::open(dir.join(format!("{name}.sqlite")))?;
        conn.execute_batch(sql)?;
        conn.pragma_update(None, "user_version", version)?;
        Ok(conn)
    }

    #[test]
    fn log_writes_the_message() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("write")?;
        let conn = create(
            &dir,
            "immich_logs",
            schema::logger_messages::SQL,
            LOGS_SCHEMA_VERSION,
        )?;
        let app_dir = CString::new(dir.to_str().ok_or("invalid test directory")?)?;
        // SAFETY: all pointers reference valid C strings for the duration of the calls.
        unsafe {
            assert_eq!(
                immich_core_log(
                    app_dir.as_ptr(),
                    ImmichCoreLogLevel::Info,
                    c"BackgroundWorker".as_ptr(),
                    c"Started engine".as_ptr()
                ),
                0
            );
            assert_ne!(
                immich_core_log(
                    app_dir.as_ptr(),
                    ImmichCoreLogLevel::Info,
                    c"BackgroundWorker".as_ptr(),
                    c"\xff".as_ptr()
                ),
                0
            );
        }
        let logged: (String, String, i64, i64) = conn.query_row(
            "select message, logger, level, count(*) from logger_messages",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )?;
        assert_eq!(
            logged,
            (
                "Started engine".into(),
                "BackgroundWorker".into(),
                LogLevel::Info as i64,
                1
            )
        );
        drop(conn);
        std::fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[test]
    fn log_skips_levels_below_the_setting() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("level")?;
        let main = create(&dir, "immich", schema::settings::SQL, MAIN_SCHEMA_VERSION)?;
        main.execute(
            "insert into settings (key, value) values ('logLevel', 'severe')",
            [],
        )?;
        let logs = create(
            &dir,
            "immich_logs",
            schema::logger_messages::SQL,
            LOGS_SCHEMA_VERSION,
        )?;
        let dir_str = dir.to_str().ok_or("invalid test directory")?;
        assert_eq!(
            log(
                dir_str,
                ImmichCoreLogLevel::Warning,
                "BackgroundWorker",
                "skipped"
            ),
            0
        );
        assert_eq!(
            log(
                dir_str,
                ImmichCoreLogLevel::Severe,
                "BackgroundWorker",
                "kept"
            ),
            0
        );
        let messages: Vec<String> = logs
            .prepare("select message from logger_messages")?
            .query_map([], |r| r.get(0))?
            .collect::<Result<_, _>>()?;
        assert_eq!(messages, ["kept"]);
        drop((main, logs));
        std::fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[test]
    fn log_failure_returns_an_error_code() {
        // SAFETY: each pointer is null or references a valid C string.
        unsafe {
            assert_ne!(
                immich_core_log(
                    c"/nonexistent".as_ptr(),
                    ImmichCoreLogLevel::Info,
                    c"BackgroundWorker".as_ptr(),
                    c"Started engine".as_ptr()
                ),
                0
            );
            assert_ne!(
                immich_core_log(
                    std::ptr::null(),
                    ImmichCoreLogLevel::Info,
                    c"BackgroundWorker".as_ptr(),
                    c"Started engine".as_ptr()
                ),
                0
            );
        }
    }
}
