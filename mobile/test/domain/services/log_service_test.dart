import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' show ClientException;
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
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:logging/logging.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart' show ApiException;

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

    sut = await LogService.create(
      logRepository: mockLogRepo,
      settingsRepository: mockSettingsRepository,
      storeService: StoreService.I,
    );
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
          storeService: StoreService.I,
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
          storeService: StoreService.I,
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
          storeService: StoreService.I,
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
          storeService: StoreService.I,
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
    const accessToken = 'Kq3Zr8WbN2xYp5aLm7cT9vQ4sD6fH1jE0gU2iO5wA8y';

    test('Replaces urls, the access token and header values when a line is logged', () async {
      await StoreService.I.put(StoreKey.serverUrl, 'https://immich.example.com');
      await StoreService.I.put(StoreKey.serverEndpoint, 'https://api.example.com/api');
      await StoreService.I.put(StoreKey.accessToken, accessToken);
      when(() => mockSettingsRepository.appConfig).thenReturn(
        const AppConfig(
          network: NetworkConfig(
            localEndpoint: 'http://192.168.1.5:2283',
            externalEndpointList: ['https://immich.example.com', 'http://nas.lan:2283'],
            customHeaders: {'X-Proxy-Key': 'cf-secret-abcdef0123', 'X-Debug': '1'},
          ),
        ),
      );
      const rows = {
        'Resuming session at https://immich.example.com/api': 'Resuming session at [EXTERNAL ENDPOINT 1]/api',
        'GET http://nas.lan:2283/api/server/ping': 'GET [EXTERNAL ENDPOINT 2]/api/server/ping',
        'GET http://192.168.1.5:2283/api/server/ping': 'GET [LOCAL ENDPOINT]/api/server/ping',
        'Using server URL: https://api.example.com/api': 'Using server URL: [SERVER URL]/api',
        'Received Authorization URL: https://auth.example.org/authorize':
            'Received Authorization URL: [OTHER URL]/authorize',
        'Causing statement: INSERT INTO "store_entity", parameters: 11, $accessToken':
            'Causing statement: INSERT INTO "store_entity", parameters: 11, [ACCESS TOKEN]',
        'Could not enqueue task DownloadTask{headers: {X-Proxy-Key: cf-secret-abcdef0123, X-Debug: 1}, retries: 1}':
            'Could not enqueue task DownloadTask{headers: {X-Proxy-Key: [HEADER VALUE], X-Debug: [HEADER VALUE]}, retries: 1}',
        'X-Proxy-Key:\tcf-secret-abcdef0123': 'X-Proxy-Key: [HEADER VALUE]',
        'Uploaded 1 assets in 1.2s': 'Uploaded 1 assets in 1.2s',
      };
      for (final row in rows.keys) {
        Logger('Test').info(row);
      }
      await sut.flush();

      final stored = verify(() => mockLogRepo.insertAll(captureAny())).captured.single as List<LogMessage>;
      expect(stored.map((m) => m.message), rows.values);
    });

    test('Hides the host and ip in http client errors', () async {
      when(
        () => mockSettingsRepository.appConfig,
      ).thenReturn(const AppConfig(network: NetworkConfig(externalEndpointList: ['http://immich:2283'])));
      final connectError = ClientException(
        'java.net.ConnectException: Failed to connect to immich/192.168.1.5:2283',
        Uri.parse('http://immich:2283/api/server/ping'),
      );
      final unknownHostError = ClientException(
        'java.net.UnknownHostException: Unable to resolve host "typo.example.org": No address associated with hostname',
        Uri.parse('https://alice:secret@typo.example.org/api/users/me'),
      );

      Logger('Test').severe(
        'Error while checking server availability',
        ApiException.withInner(
          400,
          'HTTP connection failed: GET /server/ping',
          connectError,
          StackTrace.fromString('#0 ApiService._isEndpointAvailable (package:immich_mobile/services/api.service.dart)'),
        ),
      );
      Logger('Test').severe('Error validating auxiliary endpoint', unknownHostError);
      await sut.flush();

      final stored = verify(() => mockLogRepo.insertAll(captureAny())).captured.single as List<LogMessage>;
      expect(
        stored.first.error,
        'ApiException 400: HTTP connection failed: GET /server/ping (Inner exception: ClientException: '
        'java.net.ConnectException: Failed to connect to [EXTERNAL ENDPOINT 1]/[IP ADDRESS]:2283, '
        'uri=[EXTERNAL ENDPOINT 1]/api/server/ping)\n\n'
        '#0 ApiService._isEndpointAvailable (package:immich_mobile/services/api.service.dart)',
      );
      expect(
        stored.last.error,
        'ClientException: java.net.UnknownHostException: Unable to resolve host "[OTHER URL]": '
        'No address associated with hostname, uri=[OTHER URL]/api/users/me',
      );
    });

    test('Hides ipv6 addresses in http client errors', () async {
      const rows = {
        'java.net.ConnectException: Failed to connect to immich.example.com/[2001:db8::5]:443':
            'java.net.ConnectException: Failed to connect to [OTHER URL]/[IP ADDRESS]:443',
        'java.net.ConnectException: Failed to connect to immich.example.com/2001:db8::5:443':
            'java.net.ConnectException: Failed to connect to [OTHER URL]/[IP ADDRESS]',
        'java.net.SocketTimeoutException: failed to connect to immich.example.com/2001:db8::5 (port 443) '
                'from /2001:db8:1234:5678:9abc:def0:1234:5678 (port 41234) after 30000ms':
            'java.net.SocketTimeoutException: failed to connect to [OTHER URL]/[IP ADDRESS] (port 443) '
            'from /[IP ADDRESS] (port 41234) after 30000ms',
        'java.net.ConnectException: Failed to connect to /[fe80::5%wlan0]:2283':
            'java.net.ConnectException: Failed to connect to /[IP ADDRESS]:2283',
        'at 12:34:56': 'at 12:34:56',
        '0:00:01.500000': '0:00:01.500000',
        'deadbeef': 'deadbeef',
        '#0      ApiClient.invokeAPI (package:openapi/api_client.dart:131:7)':
            '#0      ApiClient.invokeAPI (package:openapi/api_client.dart:131:7)',
      };
      for (final row in rows.keys) {
        Logger('Test').severe('Upload error', ClientException(row, Uri.parse('https://immich.example.com/api/assets')));
      }
      await sut.flush();

      final stored = verify(() => mockLogRepo.insertAll(captureAny())).captured.single as List<LogMessage>;
      expect(stored.map((m) => m.error), [
        for (final row in rows.values) 'ClientException: $row, uri=[OTHER URL]/api/assets',
      ]);
    });

    test('Keeps the labels of a line logged before a logout', () async {
      final settings = await SettingsRepository.ensureInitialized(db);
      addTearDown(SettingsRepository.reset);
      await settings.write(SettingsKey.networkExternalEndpointList, ['https://immich.example.com']);
      await StoreService.I.put(StoreKey.accessToken, accessToken);
      await sut.dispose();
      sut = await LogService.create(
        logRepository: mockLogRepo,
        settingsRepository: settings,
        storeService: StoreService.I,
      );

      Logger('Test').info('Resuming session at https://immich.example.com/api with $accessToken');
      // the store and settings changes of AuthService.clearLocalData
      await StoreService.I.delete(StoreKey.accessToken);
      await settings.clear(const [
        .networkAutoEndpointSwitching,
        .networkPreferredWifiName,
        .networkLocalEndpoint,
        .networkExternalEndpointList,
      ]);
      Logger('Test').info('Resuming session at https://immich.example.com/api');
      await sut.flush();

      final stored = verify(() => mockLogRepo.insertAll(captureAny())).captured.single as List<LogMessage>;
      expect(stored.map((m) => m.message), [
        'Resuming session at [EXTERNAL ENDPOINT 1]/api with [ACCESS TOKEN]',
        'Resuming session at [OTHER URL]/api',
      ]);
    });
  });
}
