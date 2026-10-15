import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/network_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:logging/logging.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';
import '../../test_utils.dart';

final _kInfoLog = LogMessage(
  message: '#Info Message',
  level: LogLevel.info,
  createdAt: DateTime(2025, 2, 26),
  logger: 'Info Logger',
);

final _kWarnLog = LogMessage(
  message: '#Warn Message',
  level: LogLevel.warning,
  createdAt: DateTime(2025, 2, 27),
  logger: 'Warn Logger',
);

void main() {
  late LogService sut;
  late LogRepository mockLogRepo;
  late MockSettingsRepository mockSettingsRepository;
  late Drift db;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
  });

  tearDownAll(() async {
    await db.close();
  });

  setUp(() async {
    mockLogRepo = MockLogRepository();
    mockSettingsRepository = MockSettingsRepository();

    registerFallbackValue(_kInfoLog);
    registerFallbackValue(LogLevel.info);

    when(() => mockLogRepo.truncate(limit: any(named: 'limit'))).thenAnswer((_) async => {});
    when(() => mockSettingsRepository.appConfig).thenReturn(const AppConfig(logLevel: LogLevel.fine));
    when(() => mockSettingsRepository.write<LogLevel, LogLevel>(SettingsKey.logLevel, any())).thenAnswer((_) async {});
    when(() => mockLogRepo.getAll()).thenAnswer((_) async => []);
    when(() => mockLogRepo.insert(any())).thenAnswer((_) async => true);
    when(() => mockLogRepo.insertAll(any())).thenAnswer((_) async => true);

    sut = await LogService.create(logRepository: mockLogRepo, settingsRepository: mockSettingsRepository);
  });

  tearDown(() async {
    await sut.dispose();
    await StoreService.I.clear();
  });

  group("Log Service Init:", () {
    test('Truncates the existing logs on init', () {
      final limit = verify(() => mockLogRepo.truncate(limit: captureAny(named: 'limit'))).captured.firstOrNull as int?;
      expect(limit, kLogTruncateLimit);
    });

    test('Sets log level based on the metadata repository', () {
      verify(() => mockSettingsRepository.appConfig).called(1);
      expect(Logger.root.level, Level.FINE);
    });
  });

  group("Log Service Set Level:", () {
    setUp(() async {
      await sut.setLogLevel(LogLevel.shout);
    });

    test('Updates the log level via metadata repository', () {
      final captured = verify(
        () => mockSettingsRepository.write<LogLevel, LogLevel>(SettingsKey.logLevel, captureAny()),
      ).captured.firstOrNull;
      expect(captured, LogLevel.shout);
    });

    test('Sets log level on logger', () {
      expect(Logger.root.level, Level.SHOUT);
    });
  });

  group("Log Service Buffer:", () {
    test('Buffers logs until timer elapses', () {
      TestUtils.fakeAsync((time) async {
        sut = await LogService.create(
          logRepository: mockLogRepo,
          settingsRepository: mockSettingsRepository,
          shouldBuffer: true,
        );

        final logger = Logger(_kInfoLog.logger!);
        logger.info(_kInfoLog.message);
        expect(await sut.getMessages(), hasLength(1));
        logger.warning(_kWarnLog.message);
        expect(await sut.getMessages(), hasLength(2));
        time.elapse(const Duration(seconds: 6));
        expect(await sut.getMessages(), isEmpty);
      });
    });

    test('Batch inserts all logs on timer', () {
      TestUtils.fakeAsync((time) async {
        sut = await LogService.create(
          logRepository: mockLogRepo,
          settingsRepository: mockSettingsRepository,
          shouldBuffer: true,
        );

        final logger = Logger(_kInfoLog.logger!);
        logger.info(_kInfoLog.message);
        time.elapse(const Duration(seconds: 6));
        final insert = verify(() => mockLogRepo.insertAll(captureAny()));
        insert.called(1);
        final captured = insert.captured.firstOrNull as List<LogMessage>;
        expect(captured.firstOrNull?.message, _kInfoLog.message);
        expect(captured.firstOrNull?.logger, _kInfoLog.logger);

        verifyNever(() => mockLogRepo.insert(captureAny()));
      });
    });

    test('Does not buffer when off', () {
      TestUtils.fakeAsync((time) async {
        sut = await LogService.create(
          logRepository: mockLogRepo,
          settingsRepository: mockSettingsRepository,
          shouldBuffer: false,
        );

        final logger = Logger(_kInfoLog.logger!);
        logger.info(_kInfoLog.message);
        // Ensure nothing gets buffer. This works because we mock log repo getAll to return nothing
        expect(await sut.getMessages(), isEmpty);

        final insert = verify(() => mockLogRepo.insert(captureAny()));
        insert.called(1);
        final captured = insert.captured.firstOrNull as LogMessage;
        expect(captured.message, _kInfoLog.message);
        expect(captured.logger, _kInfoLog.logger);

        verifyNever(() => mockLogRepo.insertAll(captureAny()));
      });
    });
  });

  group("Log Service Get messages:", () {
    setUp(() {
      when(() => mockLogRepo.getAll()).thenAnswer((_) async => [_kInfoLog]);
    });

    test('Fetches result from DB', () async {
      expect(await sut.getMessages(), hasLength(1));
      verify(() => mockLogRepo.getAll()).called(1);
    });

    test('Combines result from both DB + Buffer', () {
      TestUtils.fakeAsync((time) async {
        sut = await LogService.create(
          logRepository: mockLogRepo,
          settingsRepository: mockSettingsRepository,
          shouldBuffer: true,
        );

        final logger = Logger(_kWarnLog.logger!);
        logger.warning(_kWarnLog.message);
        expect(await sut.getMessages(), hasLength(2)); // 1 - DB, 1 - Buff

        final messages = await sut.getMessages();
        // Logged time is assigned in the service for messages in the buffer, so compare manually
        expect(messages.firstOrNull?.message, _kWarnLog.message);
        expect(messages.firstOrNull?.logger, _kWarnLog.logger);

        expect(messages.elementAtOrNull(1), _kInfoLog);
      });
    });
  });

  group("Log Service Redaction:", () {
    test('Returns stored rows with held values by name and other values by kind', () async {
      await StoreService.I.put(StoreKey.serverUrl, 'https://Immich.Example.com/api');
      await StoreService.I.put(StoreKey.accessToken, 'tKq3Zr8WbN2xYp5aLm7c');
      await StoreService.I.put(StoreKey.serverEndpoint, 'http://192.168.1.5:2283/api');
      when(() => mockSettingsRepository.appConfig).thenReturn(
        const AppConfig(
          network: NetworkConfig(
            preferredWifiName: 'Home',
            localEndpoint: 'http://192.168.1.5:2283',
            externalEndpointList: ['https://ext.example.net', 'http://10.0.0.7:2283'],
          ),
        ),
      );
      const rows = {
        'Resuming session at https://immich.example.com/api': 'Resuming session at <server url>',
        'Failed to connect to ext.example.net/203.0.113.9:443, uri=https://ext.example.net/api':
            'Failed to connect to <external endpoint 1>/<ip>:443, uri=<external endpoint 1>/api',
        'GET http://10.0.0.7:2283/api/server/ping': 'GET <external endpoint 2>/api/server/ping',
        'failed to connect to /192.168.1.5 (port 2283) from /192.168.1.52 (port 51234) after 5000ms':
            'failed to connect to /<local endpoint> (port 2283) from /<ip> (port 51234) after 5000ms',
        'Failed to connect to typo.example.org/198.51.100.4:443, uri=https://typo.example.org/api':
            'Failed to connect to <host>/<ip>:443, uri=https://<host>/api',
        "Failed host lookup: 'old-server.lan'": "Failed host lookup: '<host>'",
        'Bearer tKq3Zr8WbN2xYp5aLm7c': 'Bearer <access token>',
        'Failed to update auth info with access token: tKq3Zr8WbN2xYp5aLm7c':
            'Failed to update auth info with access token: <access token>',
        'Failed to update auth info with access token: old-token-456':
            'Failed to update auth info with access token: <access token>',
        'Received OAuth callback: app.immich:///oauth-callback?code=abc123&state=xyz':
            'Received OAuth callback: app.immich:///oauth-callback?code=<oauth code>&state=xyz',
        'login response: someone@example.com': 'login response: <email>',
        'Causing statement: INSERT INTO "auth_user_entity", parameters: a, pin-hash-789':
            'Causing statement: INSERT INTO "auth_user_entity", parameters: <parameters>',
        'Home screen loaded': 'Home screen loaded',
      };
      when(
        () => mockLogRepo.getAll(),
      ).thenAnswer((_) async => [for (final row in rows.keys) _kInfoLog.copyWith(message: row)]);

      expect((await sut.getMessages()).map((m) => m.message), rows.values);
    });

    test('Names a server by its switching configuration', () async {
      await StoreService.I.put(StoreKey.serverUrl, 'https://immich.example.com/api');
      await StoreService.I.put(StoreKey.serverEndpoint, 'https://immich.example.com/api');
      when(
        () => mockSettingsRepository.appConfig,
      ).thenReturn(const AppConfig(network: NetworkConfig(externalEndpointList: ['https://immich.example.com'])));

      Logger('Test').severe(
        'Using external endpoint 1',
        'Failed to connect to immich.example.com/203.0.113.9:443, uri=https://immich.example.com/api/server/ping',
        StackTrace.fromString('#0 ping (https://immich.example.com/api/server/ping)'),
      );

      final message = (await sut.getMessages()).single;
      expect(message.message, 'Using external endpoint 1');
      expect(
        message.error,
        'Failed to connect to <external endpoint 1>/<ip>:443, uri=<external endpoint 1>/server/ping',
      );
      expect(message.stack, '#0 ping (<external endpoint 1>/server/ping)');
    });

    test('Names a server endpoint on another host as the server url', () async {
      await StoreService.I.put(StoreKey.serverUrl, 'https://immich.example.com/api');
      await StoreService.I.put(StoreKey.serverEndpoint, 'https://api.example.org/api');
      when(
        () => mockLogRepo.getAll(),
      ).thenAnswer((_) async => [_kInfoLog.copyWith(message: 'Using server URL: https://api.example.org/api')]);

      expect((await sut.getMessages()).single.message, 'Using server URL: <server url>');
    });
  });
}
