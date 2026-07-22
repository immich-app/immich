import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:mocktail/mocktail.dart';

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
  late MockAssetMediaRepository assetMediaRepository;
  late MockDownloadRepository downloadRepository;
  late MockTagService tagService;

  late Drift db;

  setUpAll(() async {
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
    assetMediaRepository = MockAssetMediaRepository();
    downloadRepository = MockDownloadRepository();
    tagService = MockTagService();

    sut = ActionService(
      assetApiRepository,
      remoteAssetRepository,
      localAssetRepository,
      albumApiRepository,
      remoteAlbumRepository,
      trashedLocalAssetRepository,
      assetMediaRepository,
      downloadRepository,
      tagService,
    );
  });

  tearDown(() async {
    await Store.clear();
  });

  group('ActionService.updateRating', () {
    const assetId = 'asset_id_1';

    test('calls both repositories with the given rating', () async {
      when(() => assetApiRepository.updateRating(assetId, 3)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateRating(assetId, 3)).thenAnswer((_) async {});

      final result = await sut.updateRating(assetId, 3);

      expect(result, isTrue);
      verify(() => assetApiRepository.updateRating(assetId, 3)).called(1);
      verify(() => remoteAssetRepository.updateRating(assetId, 3)).called(1);
    });

    test('calls both repositories with null to clear rating', () async {
      when(() => assetApiRepository.updateRating(assetId, null)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateRating(assetId, null)).thenAnswer((_) async {});

      final result = await sut.updateRating(assetId, null);

      expect(result, isTrue);
      verify(() => assetApiRepository.updateRating(assetId, null)).called(1);
      verify(() => remoteAssetRepository.updateRating(assetId, null)).called(1);
    });
  });

  group('ActionService.applyDateTime', () {
    const ids = ['asset_id_1'];

    test('sends the picked value to the api with its offset intact', () async {
      const picked = '2026-06-10T19:15:00.000+06:00';
      when(() => assetApiRepository.updateDateTime(ids, picked)).thenAnswer((_) async {});
      when(
        () => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC+06:00'),
      ).thenAnswer((_) async {});

      await sut.applyDateTime(ids, picked);

      verify(() => assetApiRepository.updateDateTime(ids, picked)).called(1);
      verify(() => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC+06:00')).called(1);
    });

    test('handles negative offsets', () async {
      const picked = '2026-01-05T08:00:00.000-05:30';
      when(() => assetApiRepository.updateDateTime(ids, picked)).thenAnswer((_) async {});
      when(
        () => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC-05:30'),
      ).thenAnswer((_) async {});

      await sut.applyDateTime(ids, picked);

      verify(() => assetApiRepository.updateDateTime(ids, picked)).called(1);
      verify(() => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: 'UTC-05:30')).called(1);
    });

    test('writes no timezone when the value has no offset', () async {
      const picked = '2026-06-10T13:15:00.000Z';
      when(() => assetApiRepository.updateDateTime(ids, picked)).thenAnswer((_) async {});
      when(
        () => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: null),
      ).thenAnswer((_) async {});

      await sut.applyDateTime(ids, picked);

      verify(() => assetApiRepository.updateDateTime(ids, picked)).called(1);
      verify(() => remoteAssetRepository.updateDateTime(ids, DateTime.parse(picked), timeZone: null)).called(1);
    });
  });

  group('ActionService.deleteLocal', () {
    test('routes deleted ids to trashed repository when Android trash handling is enabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      const ids = ['a', 'b'];

      when(() => assetMediaRepository.deleteAll(ids, trash: true)).thenAnswer((_) async => ids);
      when(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids, trash: true)).called(1);
      verify(() => trashedLocalAssetRepository.applyTrashedAssets(ids)).called(1);
      verifyNever(() => localAssetRepository.delete(any()));
    });

    test('deletes locally when Android trash handling is disabled', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, false);
      const ids = ['c'];

      when(() => assetMediaRepository.deleteAll(ids, trash: true)).thenAnswer((_) async => ids);
      when(() => localAssetRepository.delete(ids)).thenAnswer((_) async {});

      final result = await sut.deleteLocal(ids);

      expect(result, ids.length);
      verify(() => assetMediaRepository.deleteAll(ids, trash: true)).called(1);
      verify(() => localAssetRepository.delete(ids)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
    });

    test('short-circuits when nothing was deleted', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);
      const ids = ['x'];

      when(() => assetMediaRepository.deleteAll(ids, trash: true)).thenAnswer((_) async => <String>[]);

      final result = await sut.deleteLocal(ids);

      expect(result, 0);
      verify(() => assetMediaRepository.deleteAll(ids, trash: true)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
      verifyNever(() => localAssetRepository.delete(any()));
    });
  });

  group('ActionService.moveToLockFolder', () {
    const remoteIds = ['r1', 'r2'];
    const localIds = ['l1', 'l2'];

    test('permanently deletes local copies without trashing, even when Android trash handling is on', () async {
      await Store.put(StoreKey.manageLocalMediaAndroid, true);

      when(() => assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked)).thenAnswer((_) async {});
      when(() => assetMediaRepository.deleteAll(localIds, trash: false)).thenAnswer((_) async => localIds);
      when(() => localAssetRepository.delete(localIds)).thenAnswer((_) async {});

      final result = await sut.moveToLockFolder(remoteIds, localIds);

      expect(result, localIds.length);
      verify(() => assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked)).called(1);
      verify(() => remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked)).called(1);
      verify(() => assetMediaRepository.deleteAll(localIds, trash: false)).called(1);
      verify(() => localAssetRepository.delete(localIds)).called(1);
      verifyNever(() => trashedLocalAssetRepository.applyTrashedAssets(any()));
    });

    test('locks remote assets without touching local media when there are no local copies', () async {
      when(() => assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked)).thenAnswer((_) async {});

      final result = await sut.moveToLockFolder(remoteIds, const []);

      expect(result, 0);
      verify(() => assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked)).called(1);
      verifyNever(() => assetMediaRepository.deleteAll(any(), trash: any(named: 'trash')));
    });

    test('returns zero when local deletion is cancelled', () async {
      when(() => assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked)).thenAnswer((_) async {});
      when(() => assetMediaRepository.deleteAll(localIds, trash: false)).thenAnswer((_) async => <String>[]);

      final result = await sut.moveToLockFolder(remoteIds, localIds);

      expect(result, 0);
      verify(() => assetMediaRepository.deleteAll(localIds, trash: false)).called(1);
      verifyNever(() => localAssetRepository.delete(any()));
    });

    test('returns the number of local copies deleted from a partial result', () async {
      const deletedIds = ['l1'];
      when(() => assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked)).thenAnswer((_) async {});
      when(() => remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked)).thenAnswer((_) async {});
      when(() => assetMediaRepository.deleteAll(localIds, trash: false)).thenAnswer((_) async => deletedIds);
      when(() => localAssetRepository.delete(deletedIds)).thenAnswer((_) async {});

      final result = await sut.moveToLockFolder(remoteIds, localIds);

      expect(result, deletedIds.length);
      verify(() => localAssetRepository.delete(deletedIds)).called(1);
    });
  });
}
