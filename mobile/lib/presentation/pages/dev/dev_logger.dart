import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/entities/log.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
// ignore: import_rule_isar
import 'package:isar/isar.dart';

const kDevLoggerTag = 'DEV';

abstract final class DLog {
  const DLog();

  static Stream<List<LogMessage>> watchLog() {
    final db = Isar.getInstance();
    if (db == null) {
      return const Stream.empty();
    }

    return db.loggerMessages
        .filter()
        .context1EqualTo(kDevLoggerTag)
        .sortByCreatedAtDesc()
        .watch(fireImmediately: true)
        .map((logs) => logs.map((log) => log.toDto()).toList());
  }

  static void clearLog() {
    final db = Isar.getInstance();
    if (db == null) {
      return;
    }

    db.writeTxnSync(() {
      db.loggerMessages.filter().context1EqualTo(kDevLoggerTag).deleteAllSync();
    });
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

    final isar = Isar.getInstance();
    if (isar == null) {
      return;
    }

    final record = LogMessage(
      message: message,
      level: LogLevel.info,
      createdAt: DateTime.now(),
      logger: kDevLoggerTag,
      error: error?.toString(),
      stack: stackTrace?.toString(),
    );

    unawaited(IsarLogRepository(isar).insert(record));
  }
}
