import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';

const kDevLoggerTag = 'DEV';

abstract final class DLog {
  const DLog();

  static Stream<List<LogMessage>> watchLog() {
    final logger = LogRepository.getInstance();
    if (logger == null) {
      return const Stream.empty();
    }

    return logger.watchMessages(kDevLoggerTag);
  }

  static void clearLog() {
    final db = LogRepository.getInstance();

    if (db == null) {
      return;
    }

    unawaited(db.deleteByLogger(kDevLoggerTag));
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

    final logger = LogRepository.getInstance();
    if (logger == null) {
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

    unawaited(logger.insert(record));
  }
}
