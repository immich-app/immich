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
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
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

class MockSyncLinkedAlbumService extends Mock implements SyncLinkedAlbumService {}

void main() {
  late BackgroundWorkerBgService sut;
  late MockSyncStreamService mockRemoteSyncService;
  late MockBackgroundUploadService mockBackgroundUploadService;
  late MockForegroundUploadService mockForegroundUploadService;
  late MockSyncLinkedAlbumService mockSyncLinkedAlbumService;
  late Drift db;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    registerFallbackValue(Completer<void>());
    registerFallbackValue(const UploadCallbacks());

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await SettingsRepository.ensureInitialized(db);
    await SettingsRepository.instance.write(SettingsKey.backupEnabled, true);
    await SettingsRepository.instance.write(SettingsKey.backupSyncAlbums, true);
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
    mockForegroundUploadService = MockForegroundUploadService();
    mockSyncLinkedAlbumService = MockSyncLinkedAlbumService();

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
        foregroundUploadServiceProvider.overrideWithValue(mockForegroundUploadService),
        backgroundUploadServiceProvider.overrideWithValue(mockBackgroundUploadService),
        syncLinkedAlbumServiceProvider.overrideWithValue(mockSyncLinkedAlbumService),
      ],
    );
  });

  group('onAndroidUpload', () {
    late int albumSteps;

    setUp(() {
      debugDefaultTargetPlatformOverride = TargetPlatform.android;
      albumSteps = 0;
      when(() => mockRemoteSyncService.sync()).thenAnswer((_) async => true);
      when(
        () => mockSyncLinkedAlbumService.syncLinkedAlbums(any(), cancellation: any(named: 'cancellation')),
      ).thenAnswer((_) async => albumSteps++);
    });

    tearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.iOS);

    void stubUploads(Future<void> Function(UploadCallbacks callbacks) uploads) {
      when(
        () => mockForegroundUploadService.uploadCandidates(
          any(),
          any(),
          callbacks: any(named: 'callbacks'),
          useSequentialUpload: true,
        ),
      ).thenAnswer((invocation) => uploads(invocation.namedArguments[#callbacks] as UploadCallbacks));
    }

    test('syncs again and adds the uploads to their albums when the run ends', () async {
      stubUploads((callbacks) async => callbacks.onSuccess?.call('local-1', 'remote-1'));

      await sut.onAndroidUpload(20);

      verify(() => mockRemoteSyncService.sync()).called(2);
      expect(albumSteps, 1);
    });

    test('adds to albums without a second sync when nothing was uploaded', () async {
      stubUploads((_) async {});

      await sut.onAndroidUpload(20);

      verify(() => mockRemoteSyncService.sync()).called(1);
      expect(albumSteps, 1);
    });

    test('adds the uploads to their albums every minute during the run', () {
      fakeAsync((async) {
        stubUploads((callbacks) async {
          callbacks.onSuccess?.call('local-1', 'remote-1');
          await Future<void>.delayed(const Duration(minutes: 1));
          callbacks.onSuccess?.call('local-2', 'remote-2');
          await Future<void>.delayed(const Duration(minutes: 5));
        });

        unawaited(sut.onAndroidUpload(20));
        async.elapse(const Duration(minutes: 2));

        expect(albumSteps, 1);
      });
    });

    test('runs one album step at a time', () {
      fakeAsync((async) {
        final albumStep = Completer<void>();
        when(
          () => mockSyncLinkedAlbumService.syncLinkedAlbums(any(), cancellation: any(named: 'cancellation')),
        ).thenAnswer((_) {
          albumSteps++;
          return albumStep.future;
        });
        stubUploads((callbacks) async {
          callbacks.onSuccess?.call('local-1', 'remote-1');
          await Future<void>.delayed(const Duration(minutes: 1));
          callbacks.onSuccess?.call('local-2', 'remote-2');
          await Future<void>.delayed(const Duration(minutes: 1));
          callbacks.onSuccess?.call('local-3', 'remote-3');
        });

        unawaited(sut.onAndroidUpload(20));
        async.elapse(const Duration(minutes: 3));
        expect(albumSteps, 1);

        albumStep.complete();
        async.flushMicrotasks();
        expect(albumSteps, 2);
      });
    });

    test('leaves the albums alone when the run times out', () {
      fakeAsync((async) {
        stubUploads((callbacks) async {
          callbacks.onSuccess?.call('local-1', 'remote-1');
          await Future<void>.delayed(const Duration(minutes: 20));
        });

        unawaited(sut.onAndroidUpload(20));
        async.elapse(const Duration(minutes: 21));

        expect(albumSteps, 0);
      });
    });
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
