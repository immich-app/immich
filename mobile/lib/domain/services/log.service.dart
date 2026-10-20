import 'dart:async';

import 'package:http/http.dart' show ClientException;
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' show ApiException;

/// Service responsible for handling application logging.
///
/// It listens to Dart's [Logger.root], buffers logs in memory (optionally),
/// writes them to a persistent [LogRepository], and manages log levels via
/// [SettingsRepository].
class LogService {
  static final _schemeAndHost = RegExp(r'''https?://[^\s/?#'"<>(),]*''');
  static final _ipAddress = RegExp(
    r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|'
    r'\[?\b(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:)+(?::[0-9a-f]{1,4})+)(?:%\w+)?\]?',
  );

  final LogRepository _logRepository;
  final SettingsRepository _settingsRepository;
  final StoreService _storeService;

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
    required StoreService storeService,
    bool shouldBuffer = true,
  }) async {
    _instance ??= await create(
      logRepository: logRepository,
      settingsRepository: settingsRepository,
      storeService: storeService,
      shouldBuffer: shouldBuffer,
    );
    return _instance!;
  }

  static Future<LogService> create({
    required LogRepository logRepository,
    required SettingsRepository settingsRepository,
    required StoreService storeService,
    bool shouldBuffer = true,
  }) async {
    final instance = LogService._(logRepository, settingsRepository, storeService, shouldBuffer);
    await logRepository.truncate(limit: kLogTruncateLimit);
    final level = instance._settingsRepository.appConfig.logLevel;
    Logger.root.level = Level.LEVELS.elementAtOrNull(level.index) ?? Level.INFO;
    return instance;
  }

  LogService._(this._logRepository, this._settingsRepository, this._storeService, this._shouldBuffer) {
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
      message: _redact(r.message),
      level: r.level.toLogLevel(),
      createdAt: r.time,
      logger: r.loggerName,
      error: r.error == null ? null : _redactError(r.error!),
      stack: r.stackTrace == null ? null : _redact(r.stackTrace.toString()),
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
    return [..._msgBuffer.reversed, ...logsFromDb];
  }

  String _redact(String text) {
    var redacted = text.replaceAllMapped(_schemeAndHost, (match) => _urlLabel(Uri.tryParse(match[0]!)));
    final accessToken = _storeService.tryGet(StoreKey.accessToken);
    if (accessToken != null) {
      redacted = redacted.replaceAll(accessToken, '[ACCESS TOKEN]');
    }
    // as a header map prints it, so a short value like "1" can't match other text
    for (final header in _settingsRepository.appConfig.network.customHeaders.entries) {
      redacted = redacted.replaceAll(
        RegExp('${RegExp.escape(header.key)}:\\s+${RegExp.escape(header.value)}'),
        '${header.key}: [HEADER VALUE]',
      );
    }
    return redacted;
  }

  String _redactError(Object error) {
    final redacted = _redact(error.toString());
    final httpError = error is ApiException ? error.innerException : error;
    if (httpError is! ClientException) {
      return redacted;
    }

    // ok_http also prints the host and its ip on their own: "Failed to connect to host/203.0.113.9:443"
    final url = httpError.uri;
    final withoutHost = url == null || url.host.isEmpty
        ? redacted
        : redacted.replaceAll(RegExp('\\b${RegExp.escape(url.host)}\\b'), _urlLabel(url));
    return withoutHost.replaceAll(_ipAddress, '[IP ADDRESS]');
  }

  String _urlLabel(Uri? url) {
    if (url == null) {
      return '[OTHER URL]';
    }

    // a server url that is also a switching entry gets the entry's label
    final network = _settingsRepository.appConfig.network;
    for (var i = 0; i < network.externalEndpointList.length; i++) {
      if (_isSameAddress(url, network.externalEndpointList[i])) {
        return '[EXTERNAL ENDPOINT ${i + 1}]';
      }
    }
    if (_isSameAddress(url, network.localEndpoint)) {
      return '[LOCAL ENDPOINT]';
    }
    if (_isSameAddress(url, _storeService.tryGet(StoreKey.serverUrl)) ||
        _isSameAddress(url, _storeService.tryGet(StoreKey.serverEndpoint))) {
      return '[SERVER URL]';
    }
    return '[OTHER URL]';
  }

  bool _isSameAddress(Uri url, String? savedUrl) {
    final saved = savedUrl == null ? null : Uri.tryParse(savedUrl);
    return saved != null && saved.scheme == url.scheme && saved.host == url.host && saved.port == url.port;
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
