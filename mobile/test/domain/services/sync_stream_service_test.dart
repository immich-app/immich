import 'dart:async';

import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/asset.stub.dart';
import '../../fixtures/sync_stream.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../mocks/asset_entity.mock.dart';
import '../../repository.mocks.dart';

class _AbortCallbackWrapper {
  const _AbortCallbackWrapper();

  bool call() => false;
}

class _MockAbortCallbackWrapper extends Mock implements _AbortCallbackWrapper {}

class _CancellationWrapper {
  const _CancellationWrapper();

  bool call() => false;
}

class _MockCancellationWrapper extends Mock implements _CancellationWrapper {}

void main() {
  late SyncStreamService sut;
  late SyncStreamRepository mockSyncStreamRepo;
  late SyncApiRepository mockSyncApiRepo;
  late DriftLocalAssetRepository mockLocalAssetRepo;
  late DriftTrashedLocalAssetRepository mockTrashedLocalAssetRepo;
  late LocalFilesManagerRepository mockLocalFilesManagerRepo;
  late StorageRepository mockStorageRepo;
  late Future<void> Function(List<SyncEvent>, Function(), Function()) handleEventsCallback;
  late _MockAbortCallbackWrapper mockAbortCallbackWrapper;
  late _MockAbortCallbackWrapper mockResetCallbackWrapper;
  late Drift db;
  late bool hasManageMediaPermission;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    registerFallbackValue(LocalAssetStub.image1);

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  successHandler(Invocation _) async => true;

  setUp(() async {
    mockSyncStreamRepo = MockSyncStreamRepository();
    mockSyncApiRepo = MockSyncApiRepository();
    mockLocalAssetRepo = MockLocalAssetRepository();
    mockTrashedLocalAssetRepo = MockTrashedLocalAssetRepository();
    mockLocalFilesManagerRepo = MockLocalFilesManagerRepository();
    mockStorageRepo = MockStorageRepository();
    mockAbortCallbackWrapper = _MockAbortCallbackWrapper();
    mockResetCallbackWrapper = _MockAbortCallbackWrapper();

    when(() => mockAbortCallbackWrapper()).thenReturn(false);

    when(() => mockSyncApiRepo.streamChanges(any())).thenAnswer((invocation) async {
      handleEventsCallback = invocation.positionalArguments.first;
    });

    when(() => mockSyncApiRepo.streamChanges(any(), onReset: any(named: 'onReset'))).thenAnswer((invocation) async {
      handleEventsCallback = invocation.positionalArguments.first;
    });

    when(() => mockSyncApiRepo.ack(any())).thenAnswer((_) async => {});

    when(() => mockSyncStreamRepo.updateUsersV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteUsersV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updatePartnerV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deletePartnerV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateAssetsV1(any())).thenAnswer(successHandler);
    when(
      () => mockSyncStreamRepo.updateAssetsV1(any(), debugLabel: any(named: 'debugLabel')),
    ).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteAssetsV1(any())).thenAnswer(successHandler);
    when(
      () => mockSyncStreamRepo.deleteAssetsV1(any(), debugLabel: any(named: 'debugLabel')),
    ).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateAssetsExifV1(any())).thenAnswer(successHandler);
    when(
      () => mockSyncStreamRepo.updateAssetsExifV1(any(), debugLabel: any(named: 'debugLabel')),
    ).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateMemoriesV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteMemoriesV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateMemoryAssetsV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteMemoryAssetsV1(any())).thenAnswer(successHandler);
    when(
      () => mockSyncStreamRepo.updateStacksV1(any(), debugLabel: any(named: 'debugLabel')),
    ).thenAnswer(successHandler);
    when(
      () => mockSyncStreamRepo.deleteStacksV1(any(), debugLabel: any(named: 'debugLabel')),
    ).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateUserMetadatasV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteUserMetadatasV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updatePeopleV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deletePeopleV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateAssetFacesV1(any())).thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteAssetFacesV1(any())).thenAnswer(successHandler);

    sut = SyncStreamService(
      syncApiRepository: mockSyncApiRepo,
      syncStreamRepository: mockSyncStreamRepo,
      localAssetRepository: mockLocalAssetRepo,
      trashedLocalAssetRepository: mockTrashedLocalAssetRepo,
      localFilesManager: mockLocalFilesManagerRepo,
      storageRepository: mockStorageRepo,
    );

    when(() => mockLocalAssetRepo.getAssetsFromBackupAlbums(any())).thenAnswer((_) async => {});
    when(() => mockTrashedLocalAssetRepo.trashLocalAsset(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepo.getToRestore()).thenAnswer((_) async => []);
    when(() => mockTrashedLocalAssetRepo.applyRestoredAssets(any())).thenAnswer((_) async {});
    hasManageMediaPermission = false;
    when(() => mockLocalFilesManagerRepo.hasManageMediaPermission()).thenAnswer((_) async => hasManageMediaPermission);
    when(() => mockLocalFilesManagerRepo.moveToTrash(any())).thenAnswer((_) async => true);
    when(() => mockLocalFilesManagerRepo.restoreAssetsFromTrash(any())).thenAnswer((_) async => []);
    when(() => mockStorageRepo.getAssetEntityForAsset(any())).thenAnswer((_) async => null);
    await Store.put(StoreKey.manageLocalMediaAndroid, false);
  });

  Future<void> simulateEvents(List<SyncEvent> events) async {
    await sut.sync();
    await handleEventsCallback(events, mockAbortCallbackWrapper.call, mockResetCallbackWrapper.call);
  }

  group("SyncStreamService - _handleEvents", () {
    test("processes events and acks successfully when handlers succeed", () async {
      final events = [
        SyncStreamStub.userDeleteV1,
        SyncStreamStub.userV1Admin,
        SyncStreamStub.userV1User,
        SyncStreamStub.partnerDeleteV1,
        SyncStreamStub.partnerV1,
      ];

      await simulateEvents(events);

      verifyInOrder([
        () => mockSyncStreamRepo.deleteUsersV1(any()),
        () => mockSyncApiRepo.ack(["2"]),
        () => mockSyncStreamRepo.updateUsersV1(any()),
        () => mockSyncApiRepo.ack(["5"]),
        () => mockSyncStreamRepo.deletePartnerV1(any()),
        () => mockSyncApiRepo.ack(["4"]),
        () => mockSyncStreamRepo.updatePartnerV1(any()),
        () => mockSyncApiRepo.ack(["3"]),
      ]);
      verifyNever(() => mockAbortCallbackWrapper());
    });

    test("processes final batch correctly", () async {
      final events = [SyncStreamStub.userDeleteV1, SyncStreamStub.userV1Admin];

      await simulateEvents(events);

      verifyInOrder([
        () => mockSyncStreamRepo.deleteUsersV1(any()),
        () => mockSyncApiRepo.ack(["2"]),
        () => mockSyncStreamRepo.updateUsersV1(any()),
        () => mockSyncApiRepo.ack(["1"]),
      ]);
      verifyNever(() => mockAbortCallbackWrapper());
    });

    test("does not process or ack when event list is empty", () async {
      await simulateEvents([]);

      verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.deleteUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.updatePartnerV1(any()));
      verifyNever(() => mockSyncStreamRepo.deletePartnerV1(any()));
      verifyNever(() => mockAbortCallbackWrapper());
      verifyNever(() => mockSyncApiRepo.ack(any()));
    });

    test("aborts and stops processing if cancelled during iteration", () async {
      final cancellationChecker = _MockCancellationWrapper();
      when(() => cancellationChecker()).thenReturn(false);

      sut = SyncStreamService(
        syncApiRepository: mockSyncApiRepo,
        syncStreamRepository: mockSyncStreamRepo,
        localAssetRepository: mockLocalAssetRepo,
        trashedLocalAssetRepository: mockTrashedLocalAssetRepo,
        localFilesManager: mockLocalFilesManagerRepo,
        storageRepository: mockStorageRepo,
        cancelChecker: cancellationChecker.call,
      );
      await sut.sync();

      final events = [SyncStreamStub.userDeleteV1, SyncStreamStub.userV1Admin, SyncStreamStub.partnerDeleteV1];

      when(() => mockSyncStreamRepo.deleteUsersV1(any())).thenAnswer((_) async {
        when(() => cancellationChecker()).thenReturn(true);
      });

      await handleEventsCallback(events, mockAbortCallbackWrapper.call, mockResetCallbackWrapper.call);

      verify(() => mockSyncStreamRepo.deleteUsersV1(any())).called(1);
      verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.deletePartnerV1(any()));

      verify(() => mockAbortCallbackWrapper()).called(1);

      verify(() => mockSyncApiRepo.ack(["2"])).called(1);
    });

    test("aborts and stops processing if cancelled before processing batch", () async {
      final cancellationChecker = _MockCancellationWrapper();
      when(() => cancellationChecker()).thenReturn(false);

      final processingCompleter = Completer<void>();
      bool handler1Started = false;
      when(() => mockSyncStreamRepo.deleteUsersV1(any())).thenAnswer((_) async {
        handler1Started = true;
        return processingCompleter.future;
      });

      sut = SyncStreamService(
        syncApiRepository: mockSyncApiRepo,
        syncStreamRepository: mockSyncStreamRepo,
        localAssetRepository: mockLocalAssetRepo,
        trashedLocalAssetRepository: mockTrashedLocalAssetRepo,
        localFilesManager: mockLocalFilesManagerRepo,
        storageRepository: mockStorageRepo,
        cancelChecker: cancellationChecker.call,
      );

      await sut.sync();

      final events = [SyncStreamStub.userDeleteV1, SyncStreamStub.userV1Admin, SyncStreamStub.partnerDeleteV1];

      final processingFuture = handleEventsCallback(
        events,
        mockAbortCallbackWrapper.call,
        mockResetCallbackWrapper.call,
      );
      await pumpEventQueue();

      expect(handler1Started, isTrue);

      // Signal cancellation while handler 1 is waiting
      when(() => cancellationChecker()).thenReturn(true);
      await pumpEventQueue();

      processingCompleter.complete();
      await processingFuture;

      verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));

      verify(() => mockSyncApiRepo.ack(["2"])).called(1);
    });

    test("processes memory sync events successfully", () async {
      final events = [
        SyncStreamStub.memoryV1,
        SyncStreamStub.memoryDeleteV1,
        SyncStreamStub.memoryToAssetV1,
        SyncStreamStub.memoryToAssetDeleteV1,
      ];

      await simulateEvents(events);

      verifyInOrder([
        () => mockSyncStreamRepo.updateMemoriesV1(any()),
        () => mockSyncApiRepo.ack(["5"]),
        () => mockSyncStreamRepo.deleteMemoriesV1(any()),
        () => mockSyncApiRepo.ack(["6"]),
        () => mockSyncStreamRepo.updateMemoryAssetsV1(any()),
        () => mockSyncApiRepo.ack(["7"]),
        () => mockSyncStreamRepo.deleteMemoryAssetsV1(any()),
        () => mockSyncApiRepo.ack(["8"]),
      ]);
      verifyNever(() => mockAbortCallbackWrapper());
    });

    test("processes mixed memory and user events in correct order", () async {
      final events = [
        SyncStreamStub.memoryDeleteV1,
        SyncStreamStub.userV1Admin,
        SyncStreamStub.memoryToAssetV1,
        SyncStreamStub.memoryV1,
      ];

      await simulateEvents(events);

      verifyInOrder([
        () => mockSyncStreamRepo.deleteMemoriesV1(any()),
        () => mockSyncApiRepo.ack(["6"]),
        () => mockSyncStreamRepo.updateUsersV1(any()),
        () => mockSyncApiRepo.ack(["1"]),
        () => mockSyncStreamRepo.updateMemoryAssetsV1(any()),
        () => mockSyncApiRepo.ack(["7"]),
        () => mockSyncStreamRepo.updateMemoriesV1(any()),
        () => mockSyncApiRepo.ack(["5"]),
      ]);
      verifyNever(() => mockAbortCallbackWrapper());
    });

    test("handles memory sync failure gracefully", () async {
      when(() => mockSyncStreamRepo.updateMemoriesV1(any())).thenThrow(Exception("Memory sync failed"));

      final events = [SyncStreamStub.memoryV1, SyncStreamStub.userV1Admin];

      expect(() async => await simulateEvents(events), throwsA(isA<Exception>()));
    });

    test("processes memory asset events with correct data types", () async {
      final events = [SyncStreamStub.memoryToAssetV1];

      await simulateEvents(events);

      verify(() => mockSyncStreamRepo.updateMemoryAssetsV1(any())).called(1);
      verify(() => mockSyncApiRepo.ack(["7"])).called(1);
    });

    test("processes memory delete events with correct data types", () async {
      final events = [SyncStreamStub.memoryDeleteV1];

      await simulateEvents(events);

      verify(() => mockSyncStreamRepo.deleteMemoriesV1(any())).called(1);
      verify(() => mockSyncApiRepo.ack(["6"])).called(1);
    });

    test("processes memory create/update events with correct data types", () async {
      final events = [SyncStreamStub.memoryV1];

      await simulateEvents(events);

      verify(() => mockSyncStreamRepo.updateMemoriesV1(any())).called(1);
      verify(() => mockSyncApiRepo.ack(["5"])).called(1);
    });
  });

  group("SyncStreamService - remote trash & restore", () {
    setUp(() async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      hasManageMediaPermission = true;
    });

    tearDown(() async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      hasManageMediaPermission = false;
    });

    test("moves backed up local and merged assets to device trash when remote trash events are received", () async {
      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-local', remoteId: null);
      final mergedAsset = LocalAssetStub.image2.copyWith(
        id: 'merged-local',
        checksum: 'checksum-merged',
        remoteId: 'remote-merged',
      );
      final assetsByAlbum = {
        'album-a': [localAsset],
        'album-b': [mergedAsset],
      };
      when(() => mockLocalAssetRepo.getAssetsFromBackupAlbums(any())).thenAnswer((invocation) async {
        final Iterable<String> requestedChecksums = invocation.positionalArguments.first as Iterable<String>;
        expect(requestedChecksums.toSet(), equals({'checksum-local', 'checksum-merged', 'checksum-remote-only'}));
        return assetsByAlbum;
      });

      final localEntity = MockAssetEntity();
      when(() => localEntity.getMediaUrl()).thenAnswer((_) async => 'content://local-only');
      when(() => mockStorageRepo.getAssetEntityForAsset(localAsset)).thenAnswer((_) async => localEntity);

      final mergedEntity = MockAssetEntity();
      when(() => mergedEntity.getMediaUrl()).thenAnswer((_) async => 'content://merged-local');
      when(() => mockStorageRepo.getAssetEntityForAsset(mergedAsset)).thenAnswer((_) async => mergedEntity);

      when(() => mockLocalFilesManagerRepo.moveToTrash(any())).thenAnswer((invocation) async {
        final urls = invocation.positionalArguments.first as List<String>;
        expect(urls, unorderedEquals(['content://local-only', 'content://merged-local']));
        return true;
      });

      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-1',
          checksum: localAsset.checksum!,
          ack: 'asset-remote-local-1',
          trashedAt: DateTime(2025, 5, 1),
        ),
        SyncStreamStub.assetTrashed(
          id: 'remote-2',
          checksum: mergedAsset.checksum!,
          ack: 'asset-remote-merged-2',
          trashedAt: DateTime(2025, 5, 2),
        ),
        SyncStreamStub.assetTrashed(
          id: 'remote-3',
          checksum: 'checksum-remote-only',
          ack: 'asset-remote-only-3',
          trashedAt: DateTime(2025, 5, 3),
        ),
      ];

      await simulateEvents(events);

      verify(() => mockTrashedLocalAssetRepo.trashLocalAsset(assetsByAlbum)).called(1);
      verify(() => mockSyncApiRepo.ack(['asset-remote-only-3'])).called(1);
    });

    test("skips device trashing when no local assets match the remote trash payload", () async {
      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-only',
          checksum: 'checksum-only',
          ack: 'asset-remote-only-9',
          trashedAt: DateTime(2025, 6, 1),
        ),
      ];

      await simulateEvents(events);

      verify(() => mockLocalAssetRepo.getAssetsFromBackupAlbums(any())).called(1);
      verifyNever(() => mockLocalFilesManagerRepo.moveToTrash(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAsset(any()));
    });

    test("does not request local deletions for permanent remote delete events", () async {
      final events = [SyncStreamStub.assetDeleteV1];

      await simulateEvents(events);

      verifyNever(() => mockLocalAssetRepo.getAssetsFromBackupAlbums(any()));
      verifyNever(() => mockLocalFilesManagerRepo.moveToTrash(any()));
      verify(() => mockSyncStreamRepo.deleteAssetsV1(any())).called(1);
    });

    test("restores trashed local assets once the matching remote assets leave the trash", () async {
      final trashedAssets = [
        LocalAssetStub.image1.copyWith(id: 'trashed-1', checksum: 'checksum-trash', remoteId: 'remote-1'),
      ];
      when(() => mockTrashedLocalAssetRepo.getToRestore()).thenAnswer((_) async => trashedAssets);

      final restoredIds = ['trashed-1'];
      when(() => mockLocalFilesManagerRepo.restoreAssetsFromTrash(any())).thenAnswer((invocation) async {
        final Iterable<LocalAsset> requestedAssets = invocation.positionalArguments.first as Iterable<LocalAsset>;
        expect(requestedAssets, orderedEquals(trashedAssets));
        return restoredIds;
      });

      final events = [
        SyncStreamStub.assetModified(
          id: 'remote-1',
          checksum: 'checksum-trash',
          ack: 'asset-remote-1-11',
        ),
      ];

      await simulateEvents(events);

      verify(() => mockTrashedLocalAssetRepo.applyRestoredAssets(restoredIds)).called(1);
    });
  });
}
