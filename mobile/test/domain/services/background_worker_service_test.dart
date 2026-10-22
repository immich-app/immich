import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:fake_async/fake_async.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/data/data_controller.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/services/background_worker.service.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/domain/services/local_sync.service.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/user.stub.dart';
import '../../service.mocks.dart';

class MockDataController extends Mock implements DataController {}

class MockLocalSyncService extends Mock implements LocalSyncService {}

class MockSyncStreamService extends Mock implements SyncStreamService {}

class MockHashService extends Mock implements HashService {}

void main() {
  late BackgroundWorkerBgService sut;
  late MockSyncStreamService mockRemoteSyncService;
  late MockBackgroundUploadService mockBackgroundUploadService;
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await SettingsRepository.ensureInitialized(db);
    await SettingsRepository.instance.write(SettingsKey.backupEnabled, true);
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await db.close();
  });

  setUp(() {
    final mockLocalSyncService = MockLocalSyncService();
    final mockHashService = MockHashService();
    final mockUserService = MockUserService();
    mockRemoteSyncService = MockSyncStreamService();
    mockBackgroundUploadService = MockBackgroundUploadService();

    when(() => mockLocalSyncService.sync()).thenAnswer((_) async {});
    when(() => mockHashService.hashAssets()).thenAnswer((_) async {});
    when(() => mockUserService.tryGetMyUser()).thenReturn(UserStub.admin);
    when(() => mockUserService.watchMyUser()).thenAnswer((_) => const Stream.empty());
    when(() => mockBackgroundUploadService.getActiveTasks(kBackupGroup)).thenAnswer((_) async => []);
    when(() => mockBackgroundUploadService.uploadBackupCandidates(any())).thenAnswer((_) async {});
    when(() => mockBackgroundUploadService.resume()).thenAnswer((_) async {});

    sut = BackgroundWorkerBgService(
      dataController: MockDataController(),
      apiService: MockApiService(),
      overrides: [
        localSyncServiceProvider.overrideWithValue(mockLocalSyncService),
        syncStreamServiceProvider.overrideWithValue(mockRemoteSyncService),
        hashServiceProvider.overrideWithValue(mockHashService),
        currentUserProvider.overrideWith((ref) => CurrentUserProvider(mockUserService)),
        foregroundUploadServiceProvider.overrideWithValue(MockForegroundUploadService()),
        backgroundUploadServiceProvider.overrideWithValue(mockBackgroundUploadService),
      ],
    );
  });

  group('onIosUpload', () {
    test('lists a new batch only after the remote sync finished', () async {
      final remoteSync = Completer<bool>();
      when(() => mockRemoteSyncService.sync()).thenAnswer((_) => remoteSync.future);

      final upload = sut.onIosUpload(true, 20);
      await pumpEventQueue();
      verifyNever(() => mockBackgroundUploadService.uploadBackupCandidates(any()));

      remoteSync.complete(true);
      await upload;
      verify(() => mockBackgroundUploadService.uploadBackupCandidates(UserStub.admin.id)).called(1);
    });

    test('does not list a new batch when the remote sync fails', () async {
      when(() => mockRemoteSyncService.sync()).thenAnswer((_) async => false);

      await sut.onIosUpload(true, 20);

      verifyNever(() => mockBackgroundUploadService.uploadBackupCandidates(any()));
    });

    test('does not list a new batch when the run times out before the remote sync finished', () {
      fakeAsync((async) {
        final remoteSync = Completer<bool>();
        when(() => mockRemoteSyncService.sync()).thenAnswer((_) => remoteSync.future);

        unawaited(sut.onIosUpload(true, 20));
        async.elapse(const Duration(seconds: 20));
        // a cancelled sync can still return true
        remoteSync.complete(true);
        async.flushMicrotasks();

        verifyNever(() => mockBackgroundUploadService.uploadBackupCandidates(any()));
      });
    });

    test('resumes pending uploads without waiting for the remote sync', () async {
      final remoteSync = Completer<bool>();
      when(() => mockRemoteSyncService.sync()).thenAnswer((_) => remoteSync.future);
      when(
        () => mockBackgroundUploadService.getActiveTasks(kBackupGroup),
      ).thenAnswer((_) async => [UploadTask(url: 'https://example.com', filename: 'photo.jpg')]);

      final upload = sut.onIosUpload(true, 20);
      await pumpEventQueue();
      verify(() => mockBackgroundUploadService.resume()).called(1);

      remoteSync.complete(true);
      await upload;
    });
  });
}
