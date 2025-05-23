import 'package:collection/collection.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/log.interface.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
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
  late ILogRepository mockLogRepo;
  late IStoreRepository mockStoreRepo;

  setUp(() async {
    mockLogRepo = MockLogRepository();
    mockStoreRepo = MockStoreRepository();

    registerFallbackValue(_kInfoLog);

    when(() => mockLogRepo.truncate(limit: any(named: 'limit')))
        .thenAnswer((_) async => {});
    when(() => mockStoreRepo.tryGet<int>(StoreKey.logLevel))
        .thenAnswer((_) async => LogLevel.fine.index);
    when(() => mockLogRepo.getAll()).thenAnswer((_) async => []);
    when(() => mockLogRepo.insert(any())).thenAnswer((_) async => true);
    when(() => mockLogRepo.insertAll(any())).thenAnswer((_) async => true);

    sut = await LogService.create(
      logRepository: mockLogRepo,
      storeRepository: mockStoreRepo,
    );
  });

  tearDown(() async {
    await sut.dispose();
  });

  group("Log Service Init:", () {
    test('Truncates the existing logs on init', () {
      final limit =
          verify(() => mockLogRepo.truncate(limit: captureAny(named: 'limit')))
              .captured
              .firstOrNull as int?;
      expect(limit, kLogTruncateLimit);
    });

    test('Sets log level based on the store setting', () {
      verify(() => mockStoreRepo.tryGet<int>(StoreKey.logLevel)).called(1);
      expect(Logger.root.level, Level.FINE);
    });
  });

  group("Log Service Set Level:", () {
    setUp(() async {
      when(() => mockStoreRepo.insert<int>(StoreKey.logLevel, any()))
          .thenAnswer((_) async => true);
      await sut.setLogLevel(LogLevel.shout);
    });

    test('Updates the log level in store', () {
      final index = verify(
        () => mockStoreRepo.insert<int>(StoreKey.logLevel, captureAny()),
      ).captured.firstOrNull;
      expect(index, LogLevel.shout.index);
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
          storeRepository: mockStoreRepo,
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
          storeRepository: mockStoreRepo,
          shouldBuffer: true,
        );

        final logger = Logger(_kInfoLog.logger!);
        logger.info(_kInfoLog.message);
        time.elapse(const Duration(seconds: 6));
        final insert = verify(() => mockLogRepo.insertAll(captureAny()));
        insert.called(1);
        // ignore: prefer-correct-json-casts
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
          storeRepository: mockStoreRepo,
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
          storeRepository: mockStoreRepo,
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
}
