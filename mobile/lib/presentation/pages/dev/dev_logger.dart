import 'dart:async';
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';

const kDevLoggerTag = 'DEV';

abstract final class DLog {
  const DLog();

  static Stream<List<LogMessage>> watchLog() {
    final db = Drift();

    final query = db.select(db.loggerMessageEntity)
      ..where((tbl) => tbl.context1.equals(kDevLoggerTag))
      ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]);

    return query.watch().map(
          (rows) => rows
              .map(
                (row) => LogMessage(
                  message: row.message,
                  level: row.level,
                  createdAt: row.createdAt,
                  logger: row.context1,
                  error: row.details,
                  stack: row.context2,
                ),
              )
              .toList(),
        );
  }

  static void clearLog() {
    final db = Drift();

    unawaited(
      db.transaction(() async {
        await (db.delete(db.loggerMessageEntity)
              ..where((tbl) => tbl.context1.equals(kDevLoggerTag)))
            .go();
      }),
    );
  }

  static void log(String message, [Object? error, StackTrace? stackTrace]) {
    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      debugPrint('[$kDevLoggerTag] [${DateTime.now()}] $message');
    }
    if (error != null) {
      debugPrint('Error: $error');
    }
    if (stackTrace != null) {
      debugPrint('StackTrace: $stackTrace');
    }

    final db = Drift();

    final record = LogMessage(
      message: message,
      level: LogLevel.info,
      createdAt: DateTime.now(),
      logger: kDevLoggerTag,
      error: error?.toString(),
      stack: stackTrace?.toString(),
    );

    unawaited(LogRepository(db).insert(record));
  }
}
