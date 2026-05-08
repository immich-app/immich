import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/remote_deleted_local_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:logging/logging.dart';
import 'package:mocktail/mocktail.dart';

import '../fixtures/asset.stub.dart';
import '../infrastructure/repository.mock.dart';
import '../repository.mocks.dart';

class MockDownloadRepository extends Mock implements DownloadRepository {}

void main() {
  late ActionService sut;

  late MockAssetApiRepository assetApiRepository;
  late MockRemoteAssetRepository remoteAssetRepository;
  late MockDriftLocalAssetRepository localAssetRepository;
  late MockDriftAlbumApiRepository albumApiRepository;
  late MockRemoteAlbumRepository remoteAlbumRepository;
  late MockTrashedLocalAssetRepository trashedLocalAssetRepository;
  late MockTrashSyncRepository trashSyncRepository;
  late MockAssetMediaRepository assetMediaRepository;
  late MockDownloadRepository downloadRepository;

  late Drift db;

  setUpAll(() async {
    registerFallbackValue(LocalAssetStub.image1);
    TestWidgetsFlutterBinding.ensureInitialized();
    debugDefaultTargetPlatformOverride = TargetPlatform.android;

    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  setUp(() {
    assetApiRepository = MockAssetApiRepository();
    remoteAssetRepository = MockRemoteAssetRepository();
    localAssetRepository = MockDriftLocalAssetRepository();
    albumApiRepository = MockDriftAlbumApiRepository();
    remoteAlbumRepository = MockRemoteAlbumRepository();
    trashedLocalAssetRepository = MockTrashedLocalAssetRepository();
    trashSyncRepository = MockTrashSyncRepository();
    assetMediaRepository = MockAssetMediaRepository();
    downloadRepository = MockDownloadRepository();

    sut = ActionService(
      assetApiRepository,
      remoteAssetRepository,
      localAssetRepository,
      albumApiRepository,
      remoteAlbumRepository,
      trashedLocalAssetRepository,
      trashSyncRepository,
      assetMediaRepository,
      downloadRepository,
      Logger('ActionServiceTest'),
    );

    when(() => localAssetRepository.getRemoteTrashCandidatesByAlbum(any())).thenAnswer((_) async => {});
    when(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).thenAnswer((_) async => {});
    when(() => trashedLocalAssetRepository.trashLocalAssets(any())).thenAnswer((_) async {});
    when(() => trashSyncRepository.updateApproves(any(), any())).thenAnswer((_) async {});
  });

  tearDown(() async {
    await Store.clear();
  });

  group('ActionService.deleteLocal', () {
    test('routes deleted ids to trashed repository when Android trash handling is enabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      const ids = ['a', 'b'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => ids);
      when(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).called(1);
      verifyNever(() => localAssetRepository.delete(any()));
    });

    test('deletes locally when Android trash handling is disabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      const ids = ['c'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => ids);
      when(() => localAssetRepository.delete(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verify(() => localAssetRepository.delete(ids)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
    });

    test('short-circuits when nothing was deleted', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      const ids = ['x'];

      when(() => assetMediaRepository.deleteAll(ids)).thenAnswer((_) async => <String>[]);

      final result = await sut.deleteLocal(ids);

      expect(result, 0);
      verify(() => assetMediaRepository.deleteAll(ids)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
      verifyNever(() => localAssetRepository.delete(any()));
    });
  });

  group('ActionService.resolveRemoteTrash', () {
    test('updates approvals and returns requested count when disallowed', () async {
      when(() => trashSyncRepository.updateApproves(any(), false)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: false);

      expect(result, (displayCount: 1, success: true));
      verify(() => trashSyncRepository.updateApproves(any(), false)).called(1);
      verifyNever(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any()));
      verifyNever(() => assetMediaRepository.deleteAll(any()));
    });

    test('returns 0 when no local assets match', () async {
      when(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).thenAnswer((_) async => {});
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      verify(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
      verifyNever(() => assetMediaRepository.deleteAll(any()));
    });

    test('keeps review pending when media plugin deletes no local files', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).thenAnswer(
        (_) async => {
          'album-1': [remoteDeleted],
        },
      );
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => []);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 0, success: false));
      verify(() => assetMediaRepository.deleteAll([localAsset.id])).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
    });

    test('moves files to trash through media plugin and updates approvals on success', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).thenAnswer(
        (_) async => {
          'album-1': [remoteDeleted],
        },
      );
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [localAsset.id]);
      when(() => trashSyncRepository.updateApproves(any(), true)).thenAnswer((_) async {});

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      verify(() => assetMediaRepository.deleteAll([localAsset.id])).called(1);
      verify(() => trashSyncRepository.updateApproves(any(), true)).called(1);
    });

    test('does not update approvals when media plugin delete fails', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).thenAnswer(
        (_) async => {
          'album-1': [remoteDeleted],
        },
      );
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => []);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 0, success: false));
      verify(() => assetMediaRepository.deleteAll([localAsset.id])).called(1);
      verifyNever(() => trashSyncRepository.updateApproves(any(), true));
    });

    test('updates approvals and syncs trash after media plugin delete', () async {
      final localAsset = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final remoteDeleted = RemoteDeletedLocalAsset(asset: localAsset, remoteDeletedAt: DateTime(2024, 1, 1));
      when(() => localAssetRepository.getTrashSyncCandidatesByAlbum(any())).thenAnswer(
        (_) async => {
          'album-1': [remoteDeleted],
        },
      );
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [localAsset.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      verifyInOrder([
        () => assetMediaRepository.deleteAll([localAsset.id]),
        () => trashedLocalAssetRepository.trashLocalAssets(any()),
        () => trashSyncRepository.updateApproves(any(), true),
      ]);
    });

    test('moves trash sync candidates preserving remote deletion dates', () async {
      final asset1 = LocalAssetStub.image1.copyWith(checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image1.copyWith(checksum: 'checksum-2', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(
        () => localAssetRepository.getTrashSyncCandidatesByAlbum(any()),
      ).thenAnswer((_) async => {'album-1': remoteDeleted});
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [asset1.id, asset2.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1', 'checksum-2'], isSyncApproved: true);

      expect(result, (displayCount: 2, success: true));
      final captured =
          verify(() => trashedLocalAssetRepository.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(captured['album-1']!.map((item) => item.remoteDeletedAt), [deletedAt1, deletedAt2]);
    });

    test('updates only deleted assets on partial media plugin success', () async {
      final asset1 = LocalAssetStub.image1.copyWith(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image2.copyWith(id: 'local-2', checksum: 'checksum-2', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(
        () => localAssetRepository.getTrashSyncCandidatesByAlbum(any()),
      ).thenAnswer((_) async => {'album-1': remoteDeleted});
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [asset1.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1', 'checksum-2'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: false));
      final capturedByAlbum =
          verify(() => trashedLocalAssetRepository.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(capturedByAlbum['album-1']!.map((item) => item.remoteDeletedAt), [deletedAt1]);
      final capturedChecksums =
          verify(() => trashSyncRepository.updateApproves(captureAny(), true)).captured.single as Iterable<String>;
      expect(capturedChecksums.toSet(), {'checksum-1'});
    });

    test('reports success and affected assets when multiple local assets share one checksum', () async {
      final asset1 = LocalAssetStub.image1.copyWith(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
      final asset2 = LocalAssetStub.image2.copyWith(id: 'local-2', checksum: 'checksum-1', remoteId: 'remote-2');
      final deletedAt1 = DateTime(2024, 1, 1);
      final deletedAt2 = DateTime(2024, 2, 2);
      final remoteDeleted = [
        RemoteDeletedLocalAsset(asset: asset1, remoteDeletedAt: deletedAt1),
        RemoteDeletedLocalAsset(asset: asset2, remoteDeletedAt: deletedAt2),
      ];
      when(
        () => localAssetRepository.getTrashSyncCandidatesByAlbum(any()),
      ).thenAnswer((_) async => {'album-1': remoteDeleted});
      when(() => assetMediaRepository.deleteAll(any())).thenAnswer((_) async => [asset1.id, asset2.id]);

      final result = await sut.resolveRemoteTrash(['checksum-1'], isSyncApproved: true);

      expect(result, (displayCount: 1, success: true));
      final capturedByAlbum =
          verify(() => trashedLocalAssetRepository.trashLocalAssets(captureAny())).captured.single
              as Map<String, Iterable<RemoteDeletedLocalAsset>>;
      expect(capturedByAlbum['album-1']!.map((item) => item.remoteDeletedAt), [deletedAt1, deletedAt2]);
      final capturedChecksums =
          verify(() => trashSyncRepository.updateApproves(captureAny(), true)).captured.single as Iterable<String>;
      expect(capturedChecksums.toSet(), {'checksum-1'});
    });
  });
}
