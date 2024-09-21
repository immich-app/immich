import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:logging/logging.dart' as logging;

/// [LogManager] is a custom logger that is built on top of the [logging] package.
/// The logs are written to the database and onto console, using `debugPrint` method.
///
/// The logs are deleted when exceeding the `maxLogEntries` (default 500) property
/// in the class.
class LogManager {
  LogManager._();
  static final LogManager _instance = LogManager._();
  static final Map<String, Logger> _loggers = <String, Logger>{};

  // ignore: match-getter-setter-field-names
  static LogManager get I => _instance;

  List<LogMessage> _msgBuffer = [];
  Timer? _timer;
  late final StreamSubscription<logging.LogRecord> _subscription;

  void _onLogRecord(logging.LogRecord record) {
    // Only print in development
    assert(() {
      debugPrint('[${record.level.name}] [${record.time}] ${record.message}');
      if (record.error != null && record.stackTrace != null) {
        debugPrint('${record.error}');
        debugPrint('${record.stackTrace}');
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
    _subscription = logging.Logger.root.onRecord.listen(_onLogRecord);
  }

  Logger get(String? loggerName) => _loggers.putIfAbsent(
        loggerName ?? 'main',
        () => Logger(loggerName ?? 'main'),
      );

  void updateLevel(LogLevel level) {
    logging.Logger.root.level =
        logging.Level.LEVELS.elementAtOrNull(level.index);
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

  static void setGlobalErrorCallbacks() {
    FlutterError.onError = (details) {
      LogManager.I.get("FlutterError").wtf(
            'Unknown framework error occured in library ${details.library ?? "<unknown>"} at node ${details.context ?? "<unkown>"}',
            details.exception,
            details.stack,
          );
      FlutterError.presentError(details);
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      LogManager.I
          .get("PlatformDispatcher")
          .wtf('Unknown error occured in root isolate', error, stack);
      return true;
    };
  }
}

class Logger {
  final String _loggerName;
  const Logger(this._loggerName);

  logging.Logger get _logger => logging.Logger(_loggerName);

  // Highly detailed
  void v(String message) => _logger.finest(message);
  // Troubleshooting
  void d(String message) => _logger.fine(message);
  // General purpose
  void i(String message) => _logger.info(message);
  // Potential issues
  void w(String message) => _logger.warning(message);
  // Error
  void e(String message, [Object? error, StackTrace? stack]) =>
      _logger.severe(message, error, stack);
  // Crash / Serious failure
  void wtf(String message, [Object? error, StackTrace? stack]) =>
      _logger.shout(message, error, stack);
}
