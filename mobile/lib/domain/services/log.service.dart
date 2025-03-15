import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:logging/logging.dart';

class LogService {
  final ILogRepository _logRepository;
  final IStoreRepository _storeRepository;

  final List<LogMessage> _msgBuffer = [];

  /// Whether to buffer logs in memory before writing to the database.
  /// This is useful when logging in quick succession, as it increases performance
  /// and reduces NAND wear. However, it may cause the logs to be lost in case of a crash / in isolates.
  final bool _shouldBuffer;
  Timer? _flushTimer;

  late final StreamSubscription<LogRecord> _logSubscription;

  LogService._(
    this._logRepository,
    this._storeRepository,
    this._shouldBuffer,
  ) {
    // Listen to log messages and write them to the database
    _logSubscription = Logger.root.onRecord.listen(_writeLogToDatabase);
  }

  static LogService? _instance;
  static LogService get I {
    if (_instance == null) {
      throw const LoggerUnInitializedException();
    }
    return _instance!;
  }

  static Future<LogService> init({
    required ILogRepository logRepository,
    required IStoreRepository storeRepository,
    bool shouldBuffer = true,
  }) async {
    if (_instance != null) {
      return _instance!;
    }
    _instance = await create(
      logRepository: logRepository,
      storeRepository: storeRepository,
      shouldBuffer: shouldBuffer,
    );
    return _instance!;
  }

  static Future<LogService> create({
    required ILogRepository logRepository,
    required IStoreRepository storeRepository,
    bool shouldBuffer = true,
  }) async {
    final instance = LogService._(logRepository, storeRepository, shouldBuffer);
    // Truncate logs to 250
    await logRepository.truncate(limit: kLogTruncateLimit);
    // Get log level from store
    final level = await instance._storeRepository.tryGet(StoreKey.logLevel);
    if (level != null) {
      Logger.root.level = Level.LEVELS.elementAtOrNull(level) ?? Level.INFO;
    }
    return instance;
  }

  Future<void> setlogLevel(LogLevel level) async {
    await _storeRepository.insert(StoreKey.logLevel, level.index);
    Logger.root.level = level.toLevel();
  }

  Future<List<LogMessage>> getMessages() async {
    final logsFromDb = await _logRepository.getAll();
    if (_msgBuffer.isNotEmpty) {
      return [..._msgBuffer.reversed, ...logsFromDb];
    }
    return logsFromDb;
  }

  Future<void> clearLogs() async {
    _flushTimer?.cancel();
    _flushTimer = null;
    _msgBuffer.clear();
    await _logRepository.deleteAll();
  }

  /// Flush pending log messages to persistent storage
  void flush() {
    if (_flushTimer == null) {
      return;
    }
    _flushTimer!.cancel();
    // TODO: Rename enable this after moving to sqlite - #16504
    // await _flushBufferToDatabase();
  }

  Future<void> dispose() {
    _flushTimer?.cancel();
    _logSubscription.cancel();
    return _flushBufferToDatabase();
  }

  void _writeLogToDatabase(LogRecord r) {
    if (kDebugMode) {
      debugPrint('[${r.level.name}] [${r.time}] ${r.message}');
    }

    final record = LogMessage(
      message: r.message,
      level: r.level.toLogLevel(),
      createdAt: r.time,
      logger: r.loggerName,
      error: r.error?.toString(),
      stack: r.stackTrace?.toString(),
    );

    if (_shouldBuffer) {
      _msgBuffer.add(record);
      _flushTimer ??= Timer(
        const Duration(seconds: 5),
        () => unawaited(_flushBufferToDatabase()),
      );
    } else {
      unawaited(_logRepository.insert(record));
    }
  }

  Future<void> _flushBufferToDatabase() async {
    _flushTimer = null;
    final buffer = [..._msgBuffer];
    _msgBuffer.clear();
    await _logRepository.insertAll(buffer);
  }
}

class LoggerUnInitializedException implements Exception {
  const LoggerUnInitializedException();

  @override
  String toString() => 'Logger is not initialized. Call init()';
}

/// Log levels according to dart logging [Level]
extension LevelDomainToInfraExtension on Level {
  LogLevel toLogLevel() =>
      LogLevel.values.elementAtOrNull(Level.LEVELS.indexOf(this)) ??
      LogLevel.info;
}

extension on LogLevel {
  Level toLevel() => Level.LEVELS.elementAtOrNull(index) ?? Level.INFO;
}
