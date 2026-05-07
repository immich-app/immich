import 'dart:async';

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';

/// Service responsible for handling application logging.
///
/// It listens to Dart's [Logger.root], buffers logs in memory (optionally),
/// writes them to a persistent [LogRepository], and manages log levels via
/// [MetadataRepository].
class LogService {
  final LogRepository _logRepository;
  final MetadataRepository _metadataRepository;

  final List<LogMessage> _msgBuffer = [];

  /// Whether to buffer logs in memory before writing to the database.
  /// This is useful when logging in quick succession, as it increases performance
  /// and reduces NAND wear. However, it may cause the logs to be lost in case of a crash / in isolates.
  final bool _shouldBuffer;

  Timer? _flushTimer;

  late final StreamSubscription<LogRecord> _logSubscription;

  static LogService? _instance;
  static LogService get I {
    if (_instance == null) {
      throw const LoggerUnInitializedException();
    }
    return _instance!;
  }

  static Future<LogService> init({
    required LogRepository logRepository,
    required MetadataRepository metadataRepository,
    bool shouldBuffer = true,
  }) async {
    _instance ??= await create(
      logRepository: logRepository,
      metadataRepository: metadataRepository,
      shouldBuffer: shouldBuffer,
    );
    return _instance!;
  }

  static Future<LogService> create({
    required LogRepository logRepository,
    required MetadataRepository metadataRepository,
    bool shouldBuffer = true,
  }) async {
    final instance = LogService._(logRepository, metadataRepository, shouldBuffer);
    await logRepository.truncate(limit: kLogTruncateLimit);
    final level = instance._metadataRepository.systemConfig.logLevel;
    Logger.root.level = Level.LEVELS.elementAtOrNull(level.index) ?? Level.INFO;
    return instance;
  }

  LogService._(this._logRepository, this._metadataRepository, this._shouldBuffer) {
    _logSubscription = Logger.root.onRecord.listen(_handleLogRecord);
  }

  void _handleLogRecord(LogRecord r) {
    dPrint(
      () =>
          '[${r.level.name}] [${r.time}] [${r.loggerName}] ${r.message}'
          '${r.error == null ? '' : '\nError: ${r.error}'}'
          '${r.stackTrace == null ? '' : '\nStack: ${r.stackTrace}'}',
    );

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
      _flushTimer ??= Timer(const Duration(seconds: 5), () => unawaited(_flushBuffer()));
    } else {
      unawaited(_logRepository.insert(record));
    }
  }

  Future<void> setLogLevel(LogLevel level) async {
    await _metadataRepository.write(MetadataKey.logLevel, level);
    Logger.root.level = level.toLevel();
  }

  Future<List<LogMessage>> getMessages() async {
    final logsFromDb = await _logRepository.getAll();
    return [..._msgBuffer.reversed, ...logsFromDb];
  }

  Future<void> clearLogs() async {
    _flushTimer?.cancel();
    _flushTimer = null;
    _msgBuffer.clear();
    await _logRepository.deleteAll();
  }

  Future<void> flush() {
    _flushTimer?.cancel();
    return _flushBuffer();
  }

  Future<void> dispose() {
    _flushTimer?.cancel();
    _logSubscription.cancel();
    return _flushBuffer();
  }

  Future<void> _flushBuffer() async {
    _flushTimer = null;
    final buffer = [..._msgBuffer];
    _msgBuffer.clear();

    if (buffer.isEmpty) {
      return;
    }

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
  LogLevel toLogLevel() => LogLevel.values.elementAtOrNull(Level.LEVELS.indexOf(this)) ?? LogLevel.info;
}

extension on LogLevel {
  Level toLevel() => Level.LEVELS.elementAtOrNull(index) ?? Level.INFO;
}
