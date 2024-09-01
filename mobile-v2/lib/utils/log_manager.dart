import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:logging/logging.dart';

/// [LogManager] is a custom logger that is built on top of the [logging] package.
/// The logs are written to the database and onto console, using `debugPrint` method.
///
/// The logs are deleted when exceeding the `maxLogEntries` (default 500) property
/// in the class.
class LogManager {
  LogManager._();
  static final LogManager _instance = LogManager._();
  // ignore: match-getter-setter-field-names
  static LogManager get I => _instance;

  List<LogMessage> _msgBuffer = [];
  Timer? _timer;
  late StreamSubscription<LogRecord> _subscription;

  void _onLogRecord(LogRecord record) {
    // Only print in development
    assert(() {
      debugPrint('[${record.level.name}] [${record.time}] ${record.message}');
      if (record.error != null && record.stackTrace != null) {
        debugPrint('${record.error}');
        debugPrintStack(stackTrace: record.stackTrace);
      }
      return true;
    }());

    final lm = LogMessage(
      logger: record.loggerName,
      content: record.message,
      level: record.level.toLogLevel(),
      createdAt: record.time,
      error: record.error?.toString(),
      stack: record.stackTrace?.toString(),
    );
    _msgBuffer.add(lm);

    // delayed batch writing to database: increases performance when logging
    // messages in quick succession and reduces NAND wear
    _timer ??= Timer(const Duration(seconds: 5), _flushBufferToDatabase);
  }

  void _flushBufferToDatabase() {
    _timer = null;
    final buffer = _msgBuffer;
    _msgBuffer = [];
    di<ILogRepository>().addAll(buffer);
  }

  void init() {
    _subscription = Logger.root.onRecord.listen(_onLogRecord);
  }

  void updateLevel(LogLevel level) {
    Logger.root.level = Level.LEVELS.elementAtOrNull(level.index);
  }

  void dispose() {
    _subscription.cancel();
  }

  void clearLogs() {
    _timer?.cancel();
    _timer = null;
    _msgBuffer.clear();
    di<ILogRepository>().clear();
  }
}
