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
    // The background worker refuses to run unless the switch is on, so every
    // existing case below needs it enabled. The dedicated group at the bottom
    // turns it off to cover the skip path.
    await SettingsRepository.instance.write(SettingsKey.backgroundSync, true);
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

  group('onAndroidUpload budget', () {
    // 这个组测 Android 分支（iOS 上 _handleBackup 直接走 URLSession 返回 false），
    // 而 setUpAll 把默认平台设成了 iOS，必须在本组内覆盖回来。
    setUp(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);
    tearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.iOS);

    // 预算到点是我们自己喊停的，不是用户手动停止。若报 false，Kotlin 侧会
    // complete(Result.success())，即「干完了、别重排」，用户观感是「传一会儿
    // 就停，得反复开 App 推它」。这条用例把这个语义钉住。
    test('asks WorkManager to reschedule when it runs out of budget', () async {
      when(() => mockRemoteSyncService.sync()).thenAnswer((_) async => true);
      final uploadService = MockForegroundUploadService();
      // 上传一直挂着，模拟还没传完就被预算掐断；预算到点时后台会 complete
      // 传进来的取消 token，真实实现随即返回。
      when(
        () => uploadService.uploadCandidates(
          any(),
          any(),
          callbacks: any(named: 'callbacks'),
          useSequentialUpload: any(named: 'useSequentialUpload'),
        ),
      ).thenAnswer((invocation) {
        final token = invocation.positionalArguments[1] as Completer<void>;
        return token.future;
      });

      final mockLocalSyncService = MockLocalSyncService();
      final mockHashService = MockHashService();
      final mockUserService = MockUserService();
      when(() => mockLocalSyncService.sync()).thenAnswer((_) async {});
      when(() => mockHashService.hashAssets()).thenAnswer((_) async {});
      when(() => mockUserService.tryGetMyUser()).thenReturn(UserStub.admin);
      when(() => mockUserService.watchMyUser()).thenAnswer((_) => const Stream.empty());

      sut = BackgroundWorkerBgService(
        dataController: MockDataController(),
        apiService: MockApiService(),
        overrides: [
          localSyncServiceProvider.overrideWithValue(mockLocalSyncService),
          syncStreamServiceProvider.overrideWithValue(mockRemoteSyncService),
          hashServiceProvider.overrideWithValue(mockHashService),
          currentUserProvider.overrideWith((ref) => CurrentUserProvider(mockUserService)),
          foregroundUploadServiceProvider.overrideWithValue(uploadService),
          backgroundUploadServiceProvider.overrideWithValue(mockBackgroundUploadService),
        ],
      );

      // maxMinutes=1 => 预算 0 秒，计时器立刻触发。
      // 不能用 fakeAsync：收尾的 _cleanup 要等文件/数据库句柄关掉，
      // fakeAsync 里没有事件循环，Future 永远完成不了。
      final needsRetry = await sut.onAndroidUpload(1).timeout(const Duration(seconds: 20));

      expect(needsRetry, isTrue, reason: '预算超时后必须要求重排');
    });
  });

  group('background sync switch', () {
    tearDown(() async {
      await SettingsRepository.instance.write(SettingsKey.backgroundSync, true);
    });

    test('skips the whole run when the switch is off', () async {
      await SettingsRepository.instance.write(SettingsKey.backgroundSync, false);

      await sut.onIosUpload(true, 20);

      verifyNever(() => mockRemoteSyncService.sync());
      verifyNever(() => mockBackgroundUploadService.uploadBackupCandidates(any()));
      verifyNever(() => mockBackgroundUploadService.resume());
    });

    test('runs when the switch is on', () async {
      await SettingsRepository.instance.write(SettingsKey.backgroundSync, true);
      when(() => mockRemoteSyncService.sync()).thenAnswer((_) async => true);

      await sut.onIosUpload(true, 20);

      verify(() => mockRemoteSyncService.sync()).called(1);
      verify(() => mockBackgroundUploadService.uploadBackupCandidates(UserStub.admin.id)).called(1);
    });
  });
}
