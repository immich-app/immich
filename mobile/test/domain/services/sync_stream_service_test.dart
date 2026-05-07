import 'dart:async';

import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../api.mocks.dart';
import '../../fixtures/asset.stub.dart';
import '../../fixtures/sync_stream.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';
import '../../service.mocks.dart';

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
  late DriftTrashSyncRepository mockTrashSyncRepo;
  late AssetMediaRepository mockAssetMediaRepo;
  late MockApiService mockApi;
  late MockServerApi mockServerApi;
  late MockSyncMigrationRepository mockSyncMigrationRepo;
  late Future<void> Function(List<SyncEvent>, Function(), Function()) handleEventsCallback;
  late _MockAbortCallbackWrapper mockAbortCallbackWrapper;
  late _MockAbortCallbackWrapper mockResetCallbackWrapper;
  late Drift db;
  late bool hasManageMediaPermission;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(const SemVer(major: 2, minor: 5, patch: 0));
    registerFallbackValue(RemoteDeletedLocalAsset(asset: LocalAssetStub.image1, remoteDeletedAt: DateTime(2025, 1, 1)));

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
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
    mockTrashSyncRepo = MockTrashSyncRepository();
    mockAssetMediaRepo = MockAssetMediaRepository();
    mockAbortCallbackWrapper = _MockAbortCallbackWrapper();
    mockResetCallbackWrapper = _MockAbortCallbackWrapper();
    mockApi = MockApiService();
    mockServerApi = MockServerApi();
    mockSyncMigrationRepo = MockSyncMigrationRepository();

    when(() => mockAbortCallbackWrapper()).thenReturn(false);

    when(() => mockSyncApiRepo.streamChanges(any(), serverVersion: any(named: 'serverVersion'))).thenAnswer((
      invocation,
    ) async {
      handleEventsCallback = invocation.positionalArguments.first;
    });

    when(
      () => mockSyncApiRepo.streamChanges(
        any(),
        onReset: any(named: 'onReset'),
        serverVersion: any(named: 'serverVersion'),
      ),
    ).thenAnswer((invocation) async {
      handleEventsCallback = invocation.positionalArguments.first;
    });

    when(() => mockSyncApiRepo.ack(any())).thenAnswer((_) async => {});
    when(() => mockSyncApiRepo.deleteSyncAck(any())).thenAnswer((_) async => {});

    when(() => mockApi.serverInfoApi).thenReturn(mockServerApi);
    when(
      () => mockServerApi.getServerVersion(),
    ).thenAnswer((_) async => ServerVersionResponseDto(major: 1, minor: 132, patch_: 0));

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
    when(() => mockSyncMigrationRepo.v20260128CopyExifWidthHeightToAsset()).thenAnswer(successHandler);

    sut = SyncStreamService(
      syncApiRepository: mockSyncApiRepo,
      syncStreamRepository: mockSyncStreamRepo,
      localAssetRepository: mockLocalAssetRepo,
      trashedLocalAssetRepository: mockTrashedLocalAssetRepo,
      assetMediaRepository: mockAssetMediaRepo,
      trashSyncRepository: mockTrashSyncRepo,
      api: mockApi,
      syncMigrationRepository: mockSyncMigrationRepo,
    );

    when(
      () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
    ).thenAnswer((_) async => <String, List<RemoteDeletedLocalAsset>>{});
    when(() => mockTrashedLocalAssetRepo.trashLocalAssets(any())).thenAnswer((_) async {});
    when(() => mockTrashedLocalAssetRepo.getToRestore()).thenAnswer((_) async => []);
    when(() => mockTrashedLocalAssetRepo.applyRestoredAssets(any())).thenAnswer((_) async {});
    hasManageMediaPermission = false;
    when(() => mockAssetMediaRepo.hasManageMediaPermission()).thenAnswer((_) async => hasManageMediaPermission);
    when(() => mockAssetMediaRepo.restoreAssetsFromTrash(any())).thenAnswer((_) async => []);
    when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((invocation) async {
      return (invocation.positionalArguments.first as List<String>).toList();
    });
    when(() => mockTrashSyncRepo.upsertReviewCandidates(any())).thenAnswer((_) async {});
    when(() => mockTrashSyncRepo.deleteOutdated(any())).thenAnswer((_) async => 0);
    when(() => mockTrashSyncRepo.deleteResolved(any())).thenAnswer((_) async => 0);
    await Store.put(StoreKey.manageLocalMediaAndroid, false);
    await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
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
        assetMediaRepository: mockAssetMediaRepo,
        cancelChecker: cancellationChecker.call,
        api: mockApi,
        syncMigrationRepository: mockSyncMigrationRepo,
        trashSyncRepository: mockTrashSyncRepo,
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
        assetMediaRepository: mockAssetMediaRepo,
        cancelChecker: cancellationChecker.call,
        api: mockApi,
        syncMigrationRepository: mockSyncMigrationRepo,
        trashSyncRepository: mockTrashSyncRepo,
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
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
        'album-b': [RemoteDeletedLocalAsset(asset: mergedAsset, remoteDeletedAt: DateTime(2025, 5, 2))],
      };
      when(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).thenAnswer((
        invocation,
      ) async {
        final Map<String, DateTime> trashedAssetsMap = invocation.positionalArguments.first as Map<String, DateTime>;
        expect(
          trashedAssetsMap,
          equals({
            'remote-1': DateTime(2025, 5, 1),
            'remote-2': DateTime(2025, 5, 2),
            'remote-3': DateTime(2025, 5, 3),
          }),
        );
        return assetsByAlbum;
      });

      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((invocation) async {
        final ids = invocation.positionalArguments.first as List<String>;
        expect(ids, unorderedEquals(['local-only', 'merged-local']));
        return ids;
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

      verifyNever(() => mockTrashSyncRepo.upsertReviewCandidates(any()));
      final trashedAssets =
          verify(() => mockTrashedLocalAssetRepo.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(trashedAssets.keys, unorderedEquals(['album-a', 'album-b']));
      expect(trashedAssets['album-a']!.map((item) => item.asset.id), ['local-only']);
      expect(trashedAssets['album-b']!.map((item) => item.asset.id), ['merged-local']);
      final resolvedChecksums =
          verify(() => mockTrashSyncRepo.deleteResolved(captureAny())).captured.single as Iterable<String>;
      expect(resolvedChecksums, unorderedEquals(['checksum-local', 'checksum-merged']));
      verify(() => mockSyncApiRepo.ack(['asset-remote-only-3'])).called(1);
    });

    test("records only unresolved candidates after automatic trash move", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
      hasManageMediaPermission = true;

      final resolvedAsset = LocalAssetStub.image1.copyWith(id: 'resolved-local', checksum: 'checksum-resolved');
      final unresolvedAsset = LocalAssetStub.image2.copyWith(id: 'unresolved-local', checksum: 'checksum-unresolved');
      final assetsByAlbum = {
        'album-a': [
          RemoteDeletedLocalAsset(asset: resolvedAsset, remoteDeletedAt: DateTime(2025, 5, 1)),
          RemoteDeletedLocalAsset(asset: unresolvedAsset, remoteDeletedAt: DateTime(2025, 5, 2)),
        ],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => ['resolved-local']);

      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-1',
          checksum: resolvedAsset.checksum!,
          ack: 'asset-remote-resolved-1',
          trashedAt: DateTime(2025, 5, 1),
        ),
        SyncStreamStub.assetTrashed(
          id: 'remote-2',
          checksum: unresolvedAsset.checksum!,
          ack: 'asset-remote-unresolved-2',
          trashedAt: DateTime(2025, 5, 2),
        ),
      ];

      await simulateEvents(events);

      final trashedAssets =
          verify(() => mockTrashedLocalAssetRepo.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(trashedAssets['album-a']!.map((item) => item.asset.id), ['resolved-local']);
      final resolvedChecksums =
          verify(() => mockTrashSyncRepo.deleteResolved(captureAny())).captured.single as Iterable<String>;
      expect(resolvedChecksums, ['checksum-resolved']);
      final reviewCandidates =
          verify(
                () => mockTrashSyncRepo.upsertReviewCandidates(captureAny<Iterable<RemoteDeletedLocalAsset>>()),
              ).captured.single
              as Iterable<RemoteDeletedLocalAsset>;
      expect(reviewCandidates.map((item) => item.asset.id), ['unresolved-local']);
    });

    test("records all candidates when automatic trash move returns no moved ids", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
      hasManageMediaPermission = true;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-failed');
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => []);

      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-1',
          checksum: localAsset.checksum!,
          ack: 'asset-remote-failed-1',
          trashedAt: DateTime(2025, 5, 1),
        ),
      ];

      await simulateEvents(events);

      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
      verifyNever(() => mockTrashSyncRepo.deleteResolved(any()));
      final reviewCandidates =
          verify(
                () => mockTrashSyncRepo.upsertReviewCandidates(captureAny<Iterable<RemoteDeletedLocalAsset>>()),
              ).captured.single
              as Iterable<RemoteDeletedLocalAsset>;
      expect(reviewCandidates.map((item) => item.asset.id), ['local-only']);
    });

    test("records all candidates when automatic trash move skips all local ids", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
      hasManageMediaPermission = true;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-no-url');
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);
      when(() => mockAssetMediaRepo.deleteAll(any())).thenAnswer((_) async => []);

      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-1',
          checksum: localAsset.checksum!,
          ack: 'asset-remote-no-url-1',
          trashedAt: DateTime(2025, 5, 1),
        ),
      ];

      await simulateEvents(events);

      verify(() => mockAssetMediaRepo.deleteAll(['local-only'])).called(1);
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
      verifyNever(() => mockTrashSyncRepo.deleteResolved(any()));
      final reviewCandidates =
          verify(
                () => mockTrashSyncRepo.upsertReviewCandidates(captureAny<Iterable<RemoteDeletedLocalAsset>>()),
              ).captured.single
              as Iterable<RemoteDeletedLocalAsset>;
      expect(reviewCandidates.map((item) => item.asset.id), ['local-only']);
    });

    test("uses review mode without moving assets to trash", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, true);
      when(() => mockAssetMediaRepo.hasManageMediaPermission()).thenAnswer((_) async => true);
      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-review', remoteId: null);
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);

      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-1',
          checksum: localAsset.checksum!,
          ack: 'asset-remote-review-1',
          trashedAt: DateTime(2025, 5, 1),
        ),
      ];

      await simulateEvents(events);

      verify(() => mockTrashSyncRepo.upsertReviewCandidates(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("does not check MANAGE_MEDIA permission on non-Android platforms", () async {
      debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = TargetPlatform.android);

      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);

      final events = [SyncStreamStub.assetModified(id: 'remote-1', checksum: 'checksum-1', ack: 'asset-mod-ack-1')];

      await simulateEvents(events);

      verifyNever(() => mockAssetMediaRepo.hasManageMediaPermission());
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

      verify(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("records review candidates even when Android trash settings and permission are disabled", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
      hasManageMediaPermission = false;

      final localAsset = LocalAssetStub.image1.copyWith(id: 'local-only', checksum: 'checksum-disabled');
      final assetsByAlbum = {
        'album-a': [RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2025, 5, 1))],
      };
      when(
        () => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>()),
      ).thenAnswer((_) async => assetsByAlbum);

      final events = [
        SyncStreamStub.assetTrashed(
          id: 'remote-1',
          checksum: localAsset.checksum!,
          ack: 'asset-remote-disabled-1',
          trashedAt: DateTime(2025, 5, 1),
        ),
      ];

      await simulateEvents(events);

      verify(() => mockTrashSyncRepo.upsertReviewCandidates(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verifyNever(() => mockTrashedLocalAssetRepo.trashLocalAssets(any()));
    });

    test("cleans stale review entries for restored remote assets without media permission", () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      await Store.put(StoreKey.reviewOutOfSyncChangesAndroid, false);
      hasManageMediaPermission = false;
      when(() => mockTrashSyncRepo.deleteOutdated(any())).thenAnswer((invocation) async {
        final remoteIds = invocation.positionalArguments.first as Iterable<String>;
        expect(remoteIds.toList(), ['remote-1']);
        return 0;
      });

      final events = [SyncStreamStub.assetModified(id: 'remote-1', checksum: 'checksum-1', ack: 'asset-restored-1')];

      await simulateEvents(events);

      verify(() => mockTrashSyncRepo.deleteOutdated(any())).called(1);
      verifyNever(() => mockAssetMediaRepo.hasManageMediaPermission());
      verifyNever(() => mockAssetMediaRepo.restoreAssetsFromTrash(any()));
    });

    test("requests local deletions lookup by remote ids for permanent remote delete events", () async {
      when(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).thenAnswer((
        invocation,
      ) async {
        final lookup = invocation.positionalArguments.first as Map<String, DateTime>;
        expect(lookup.keys.toSet(), equals({'remote-asset'}));
        return {};
      });

      final events = [SyncStreamStub.assetDeleteV1];

      await simulateEvents(events);

      verify(() => mockLocalAssetRepo.getRemoteTrashCandidatesByAlbum(any<Map<String, DateTime>>())).called(1);
      verifyNever(() => mockAssetMediaRepo.deleteAll(any()));
      verify(() => mockSyncStreamRepo.deleteAssetsV1(any())).called(1);
    });
  });

  group('SyncStreamService - Sync Migration', () {
    test('ensure that <2.5.0 migrations run', () async {
      await Store.put(StoreKey.syncMigrationStatus, "[]");
      when(
        () => mockServerApi.getServerVersion(),
      ).thenAnswer((_) async => ServerVersionResponseDto(major: 2, minor: 4, patch_: 1));

      await sut.sync();

      verifyInOrder([
        () => mockSyncApiRepo.deleteSyncAck([
          SyncEntityType.assetExifV1,
          SyncEntityType.partnerAssetExifV1,
          SyncEntityType.albumAssetExifCreateV1,
          SyncEntityType.albumAssetExifUpdateV1,
        ]),
        () => mockSyncMigrationRepo.v20260128CopyExifWidthHeightToAsset(),
      ]);

      // should only run on server >2.5.0
      verifyNever(
        () => mockSyncApiRepo.deleteSyncAck([
          SyncEntityType.assetV1,
          SyncEntityType.partnerAssetV1,
          SyncEntityType.albumAssetCreateV1,
          SyncEntityType.albumAssetUpdateV1,
        ]),
      );
    });
    test('ensure that >=2.5.0 migrations run', () async {
      await Store.put(StoreKey.syncMigrationStatus, "[]");
      when(
        () => mockServerApi.getServerVersion(),
      ).thenAnswer((_) async => ServerVersionResponseDto(major: 2, minor: 5, patch_: 0));
      await sut.sync();

      verifyInOrder([
        () => mockSyncApiRepo.deleteSyncAck([
          SyncEntityType.assetExifV1,
          SyncEntityType.partnerAssetExifV1,
          SyncEntityType.albumAssetExifCreateV1,
          SyncEntityType.albumAssetExifUpdateV1,
        ]),
        () => mockSyncApiRepo.deleteSyncAck([
          SyncEntityType.assetV1,
          SyncEntityType.partnerAssetV1,
          SyncEntityType.albumAssetCreateV1,
          SyncEntityType.albumAssetUpdateV1,
        ]),
      ]);

      // v20260128_ResetAssetV1 writes that v20260128_CopyExifWidthHeightToAsset has been completed
      verifyNever(() => mockSyncMigrationRepo.v20260128CopyExifWidthHeightToAsset());
    });

    test('ensure that migrations do not re-run', () async {
      await Store.put(
        StoreKey.syncMigrationStatus,
        '["${SyncMigrationTask.v20260128_CopyExifWidthHeightToAsset.name}"]',
      );

      when(
        () => mockServerApi.getServerVersion(),
      ).thenAnswer((_) async => ServerVersionResponseDto(major: 2, minor: 4, patch_: 1));

      await sut.sync();

      verifyNever(() => mockSyncMigrationRepo.v20260128CopyExifWidthHeightToAsset());
    });
  });
}
