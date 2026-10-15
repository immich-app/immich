import 'dart:async';

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';

/// Service responsible for handling application logging.
///
/// It listens to Dart's [Logger.root], buffers logs in memory (optionally),
/// writes them to a persistent [LogRepository], and manages log levels via
/// [SettingsRepository].
class LogService {
  static final _url = RegExp(r'''\b\w+://[^\s'",]+''');
  static final _kinds = [
    (RegExp(r'\b\d{1,3}(?:\.\d{1,3}){3}\b'), 'ip'),
    (RegExp(r"(?<=://|host lookup: '|address = |host: )[^\s/?#,'<]+"), 'host'),
    (RegExp(r'\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+'), 'email'),
    (RegExp(r'(?<=[?&]code=)[^&\s#]+'), 'oauth code'),
    (RegExp(r'(?<=, parameters: ).+'), 'parameters'),
    // older versions logged it when a resumed session failed
    (RegExp(r'(?<=access token: )[^\s<]+'), 'access token'),
  ];

  final LogRepository _logRepository;
  final SettingsRepository _settingsRepository;

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
    required SettingsRepository settingsRepository,
    bool shouldBuffer = true,
  }) async {
    _instance ??= await create(
      logRepository: logRepository,
      settingsRepository: settingsRepository,
      shouldBuffer: shouldBuffer,
    );
    return _instance!;
  }

  static Future<LogService> create({
    required LogRepository logRepository,
    required SettingsRepository settingsRepository,
    bool shouldBuffer = true,
  }) async {
    final instance = LogService._(logRepository, settingsRepository, shouldBuffer);
    await logRepository.truncate(limit: kLogTruncateLimit);
    final level = instance._settingsRepository.appConfig.logLevel;
    Logger.root.level = Level.LEVELS.elementAtOrNull(level.index) ?? Level.INFO;
    return instance;
  }

  LogService._(this._logRepository, this._settingsRepository, this._shouldBuffer) {
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
    await _settingsRepository.write(SettingsKey.logLevel, level);
    Logger.root.level = level.toLevel();
  }

  Future<List<LogMessage>> getMessages() async {
    final logsFromDb = await _logRepository.getAll();
    return redact([..._msgBuffer.reversed, ...logsFromDb], held());
  }

  static List<LogMessage> redact(List<LogMessage> messages, [Map<String, String> held = const {}]) {
    final names = {
      // a library can print a url's host on its own
      for (final m in messages)
        for (final text in [m.message, ?m.error, ?m.stack])
          for (final url in _url.allMatches(text)) ?Uri.tryParse(url[0]!)?.host: 'host',
      for (final MapEntry(key: value, value: name) in held.entries) value.toLowerCase(): name,
    };
    // under 8 chars would match normal words
    final values = [
      for (final value in names.keys)
        if (value.length >= 8) RegExp.escape(value),
    ];
    final named = RegExp('(?<!\\w)(?:${values.join('|')})(?!\\w)', caseSensitive: false);

    String redact(String text) {
      var redacted = values.isEmpty ? text : text.replaceAllMapped(named, (m) => '<${names[m[0]!.toLowerCase()]}>');
      for (final (pattern, kind) in _kinds) {
        redacted = redacted.replaceAll(pattern, '<$kind>');
      }
      return redacted;
    }

    return [
      for (final m in messages)
        m.copyWith(
          message: redact(m.message),
          error: m.error == null ? null : redact(m.error!),
          stack: m.stack == null ? null : redact(m.stack!),
        ),
    ];
  }

  // the values this install holds, by the name a reader of the logs knows them by
  Map<String, String> held() {
    final network = _settingsRepository.appConfig.network;
    final urls = {
      ?Store.tryGet(StoreKey.serverUrl): 'server url',
      ?Store.tryGet(StoreKey.serverEndpoint): 'server url',
      ?network.localEndpoint: 'local endpoint',
      for (final (i, url) in network.externalEndpointList.indexed) url: 'external endpoint ${i + 1}',
    };
    // later entries win, so a server that is also a switching configuration reads as that configuration
    final hosts = {for (final MapEntry(key: url, value: name) in urls.entries) ?Uri.tryParse(url)?.host: name};
    return {
      ...hosts,
      for (final MapEntry(key: url, value: name) in urls.entries) url: hosts[Uri.tryParse(url)?.host] ?? name,
      ?Store.tryGet(StoreKey.accessToken): 'access token',
      ?network.preferredWifiName: 'wifi name',
      for (final (i, value) in network.customHeaders.values.indexed) value: 'header ${i + 1}',
    };
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

  Future<void> dispose() async {
    _flushTimer?.cancel();
    _flushTimer = null;
    await _logSubscription.cancel();
    await _flushBuffer();
    // Allow a subsequent init() (e.g. when a worker isolate is reused) to
    // create a fresh instance instead of returning this disposed one.
    if (identical(_instance, this)) {
      _instance = null;
    }
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
