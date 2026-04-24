import 'package:collection/collection.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/config/log_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_kind.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
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
  late MockCachedMetadataRepository mockMetadataRepository;

  setUp(() async {
    mockLogRepo = MockLogRepository();
    mockMetadataRepository = MockCachedMetadataRepository();

    registerFallbackValue(_kInfoLog);
    SystemConfig identityMutator(SystemConfig c) => c;
    registerFallbackValue(identityMutator);

    when(() => mockLogRepo.truncate(limit: any(named: 'limit'))).thenAnswer((_) async => {});
    when(
      () => mockMetadataRepository.read(MetadataKind.systemConfig),
    ).thenReturn(const SystemConfig(log: LogConfig(level: LogLevel.fine)));
    when(() => mockMetadataRepository.update<SystemConfig>(MetadataKind.systemConfig, any())).thenAnswer((_) async {});
    when(() => mockLogRepo.getAll()).thenAnswer((_) async => []);
    when(() => mockLogRepo.insert(any())).thenAnswer((_) async => true);
    when(() => mockLogRepo.insertAll(any())).thenAnswer((_) async => true);

    sut = await LogService.create(logRepository: mockLogRepo, metadataRepository: mockMetadataRepository);
  });

  tearDown(() async {
    await sut.dispose();
  });

  group("Log Service Init:", () {
    test('Truncates the existing logs on init', () {
      final limit = verify(() => mockLogRepo.truncate(limit: captureAny(named: 'limit'))).captured.firstOrNull as int?;
      expect(limit, kLogTruncateLimit);
    });

    test('Sets log level based on the metadata repository', () {
      verify(() => mockMetadataRepository.read(MetadataKind.systemConfig)).called(1);
      expect(Logger.root.level, Level.FINE);
    });
  });

  group("Log Service Set Level:", () {
    setUp(() async {
      await sut.setLogLevel(LogLevel.shout);
    });

    test('Updates the log level via metadata repository', () {
      final mutator =
          verify(
                () => mockMetadataRepository.update<SystemConfig>(MetadataKind.systemConfig, captureAny()),
              ).captured.firstOrNull
              as SystemConfig Function(SystemConfig)?;
      final result = mutator?.call(const SystemConfig());
      expect(result?.log.level, LogLevel.shout);
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
          metadataRepository: mockMetadataRepository,
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
          metadataRepository: mockMetadataRepository,
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
          metadataRepository: mockMetadataRepository,
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
          metadataRepository: mockMetadataRepository,
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
