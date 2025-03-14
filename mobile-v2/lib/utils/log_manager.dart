// ignore_for_file: avoid-collection-mutating-methods

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

  /// Whether to buffer logs in memory before writing to the database.
  /// This is useful when logging in quick succession, as it increases performance
  /// and reduces NAND wear. However, it may cause the logs to be lost in case of a crash / in isolates.
  bool _shouldBuffer = true;
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
      content: record.message,
      level: record.level.toLogLevel(),
      createdAt: record.time,
      logger: record.loggerName,
      error: record.error?.toString(),
      stack: record.stackTrace?.toString(),
    );

    if (_shouldBuffer) {
      _msgBuffer.add(lm);
      _timer ??=
          Timer(const Duration(seconds: 5), () => _flushBufferToDatabase());
    } else {
      unawaited(di<ILogRepository>().create(lm));
    }
  }

  void _flushBufferToDatabase() {
    _timer = null;
    final buffer = _msgBuffer;
    _msgBuffer = [];
    unawaited(di<ILogRepository>().createAll(buffer));
  }

  Future<void> init({bool? shouldBuffer}) async {
    _shouldBuffer = shouldBuffer ?? _shouldBuffer;
    _subscription = logging.Logger.root.onRecord.listen(_onLogRecord);
    await di<ILogRepository>().truncate();
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
    unawaited(_subscription.cancel());
    _timer?.cancel();
  }

  Future<void> clearLogs() async {
    _timer?.cancel();
    _timer = null;
    _msgBuffer.clear();
    await di<ILogRepository>().deleteAll();
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

  /// Finest / Verbose logs. Useful for highly detailed messages
  void v(String message) => _logger.finest(message);

  /// Fine / Debug logs. Useful for troubleshooting
  void d(String message) => _logger.fine(message);

  /// Info logs. Useful for general logging
  void i(String message) => _logger.info(message);

  /// Warning logs. Useful to identify potential issues
  void w(String message, [Object? error, StackTrace? stack]) =>
      _logger.warning(message, error, stack);

  /// Error logs. Useful for identifying issues
  void e(String message, [Object? error, StackTrace? stack]) =>
      _logger.severe(message, error, stack);

  /// Crash / Serious failure logs. Shouldn't happen
  void wtf(String message, [Object? error, StackTrace? stack]) =>
      _logger.shout(message, error, stack);
}
