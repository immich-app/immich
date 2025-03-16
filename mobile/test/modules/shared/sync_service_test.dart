import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/log.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';
import '../../repository.mocks.dart';
import '../../service.mocks.dart';
import '../../test_utils.dart';

void main() {
  int assetIdCounter = 0;
  Asset makeAsset({
    required String checksum,
    String? localId,
    String? remoteId,
    int ownerId = 590700560494856554, // hash of "1"
  }) {
    final DateTime date = DateTime(2000);
    return Asset(
      id: assetIdCounter++,
      checksum: checksum,
      localId: localId,
      remoteId: remoteId,
      ownerId: ownerId,
      fileCreatedAt: date,
      fileModifiedAt: date,
      updatedAt: date,
      durationInSeconds: 0,
      type: AssetType.image,
      fileName: localId ?? remoteId ?? "",
      isFavorite: false,
      isArchived: false,
      isTrashed: false,
    );
  }

  group('Test SyncService grouped', () {
    final MockHashService hs = MockHashService();
    final MockEntityService entityService = MockEntityService();
    final MockAlbumRepository albumRepository = MockAlbumRepository();
    final MockAssetRepository assetRepository = MockAssetRepository();
    final MockExifInfoRepository exifInfoRepository = MockExifInfoRepository();
    final MockUserRepository userRepository = MockUserRepository();
    final MockETagRepository eTagRepository = MockETagRepository();
    final MockAlbumMediaRepository albumMediaRepository =
        MockAlbumMediaRepository();
    final MockAlbumApiRepository albumApiRepository = MockAlbumApiRepository();
    final MockPartnerApiRepository partnerApiRepository =
        MockPartnerApiRepository();
    final MockUserApiRepository userApiRepository = MockUserApiRepository();
    final MockPartnerRepository partnerRepository = MockPartnerRepository();

    final owner = UserDto(
      uid: "1",
      updatedAt: DateTime.now(),
      email: "a@b.c",
      name: "first last",
      isAdmin: false,
    );
    late SyncService s;
    setUpAll(() async {
      WidgetsFlutterBinding.ensureInitialized();
      final db = await TestUtils.initIsar();

      db.writeTxnSync(() => db.clearSync());
      await StoreService.init(storeRepository: IsarStoreRepository(db));
      await Store.put(StoreKey.currentUser, owner);
      await LogService.init(
        logRepository: IsarLogRepository(db),
        storeRepository: IsarStoreRepository(db),
      );
    });
    final List<Asset> initialAssets = [
      makeAsset(checksum: "a", remoteId: "0-1"),
      makeAsset(checksum: "b", remoteId: "2-1"),
      makeAsset(checksum: "c", localId: "1", remoteId: "1-1"),
      makeAsset(checksum: "d", localId: "2"),
      makeAsset(checksum: "e", localId: "3"),
    ];
    setUp(() {
      s = SyncService(
        hs,
        entityService,
        albumMediaRepository,
        albumApiRepository,
        albumRepository,
        assetRepository,
        exifInfoRepository,
        partnerRepository,
        userRepository,
        StoreService.I,
        eTagRepository,
        partnerApiRepository,
        userApiRepository,
      );
      when(() => eTagRepository.get(owner.id))
          .thenAnswer((_) async => ETag(id: owner.uid, time: DateTime.now()));
      when(() => eTagRepository.deleteByIds(["1"])).thenAnswer((_) async {});
      when(() => eTagRepository.upsertAll(any())).thenAnswer((_) async {});
      when(() => partnerRepository.getSharedWith()).thenAnswer((_) async => []);
      when(() => userRepository.getAll(sortBy: SortUserBy.id))
          .thenAnswer((_) async => [owner]);
      when(() => userRepository.getAll()).thenAnswer((_) async => [owner]);
      when(
        () => assetRepository.getAll(
          ownerId: owner.id,
          sortBy: AssetSort.checksum,
        ),
      ).thenAnswer((_) async => initialAssets);
      when(() => assetRepository.getAllByOwnerIdChecksum(any(), any()))
          .thenAnswer((_) async => [initialAssets[3], null, null]);
      when(() => assetRepository.updateAll(any())).thenAnswer((_) async => []);
      when(() => assetRepository.deleteByIds(any())).thenAnswer((_) async {});
      when(() => exifInfoRepository.updateAll(any()))
          .thenAnswer((_) async => []);
      when(() => assetRepository.transaction<void>(any())).thenAnswer(
        (call) => (call.positionalArguments.first as Function).call(),
      );
      when(() => assetRepository.transaction<Null>(any())).thenAnswer(
        (call) => (call.positionalArguments.first as Function).call(),
      );
      when(() => userApiRepository.getAll()).thenAnswer((_) async => [owner]);
      registerFallbackValue(Direction.sharedByMe);
      when(() => partnerApiRepository.getAll(any()))
          .thenAnswer((_) async => []);
    });
    test('test inserting existing assets', () async {
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1"),
        makeAsset(checksum: "b", remoteId: "2-1"),
        makeAsset(checksum: "c", remoteId: "1-1"),
      ];
      final bool c1 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
      );
      expect(c1, isFalse);
      verifyNever(() => assetRepository.updateAll(any()));
    });

    test('test inserting new assets', () async {
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1"),
        makeAsset(checksum: "b", remoteId: "2-1"),
        makeAsset(checksum: "c", remoteId: "1-1"),
        makeAsset(checksum: "d", remoteId: "1-2"),
        makeAsset(checksum: "f", remoteId: "1-4"),
        makeAsset(checksum: "g", remoteId: "3-1"),
      ];
      final bool c1 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
      );
      expect(c1, isTrue);
      final updatedAsset = initialAssets[3].updatedCopy(remoteAssets[3]);
      verify(
        () => assetRepository
            .updateAll([remoteAssets[4], remoteAssets[5], updatedAsset]),
      );
    });

    test('test syncing duplicate assets', () async {
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1"),
        makeAsset(checksum: "b", remoteId: "1-1"),
        makeAsset(checksum: "c", remoteId: "2-1"),
        makeAsset(checksum: "h", remoteId: "2-1b"),
        makeAsset(checksum: "i", remoteId: "2-1c"),
        makeAsset(checksum: "j", remoteId: "2-1d"),
      ];
      final bool c1 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
      );
      expect(c1, isTrue);
      when(
        () => assetRepository.getAll(
          ownerId: owner.id,
          sortBy: AssetSort.checksum,
        ),
      ).thenAnswer((_) async => remoteAssets);
      final bool c2 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
      );
      expect(c2, isFalse);
      final currentState = [...remoteAssets];
      when(
        () => assetRepository.getAll(
          ownerId: owner.id,
          sortBy: AssetSort.checksum,
        ),
      ).thenAnswer((_) async => currentState);
      remoteAssets.removeAt(4);
      final bool c3 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
      );
      expect(c3, isTrue);
      remoteAssets.add(makeAsset(checksum: "k", remoteId: "2-1e"));
      remoteAssets.add(makeAsset(checksum: "l", remoteId: "2-2"));
      final bool c4 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
      );
      expect(c4, isTrue);
    });

    test('test efficient sync', () async {
      when(
        () => assetRepository.deleteAllByRemoteId(
          [initialAssets[1].remoteId!, initialAssets[2].remoteId!],
          state: AssetState.remote,
        ),
      ).thenAnswer((_) async {});
      when(
        () => assetRepository
            .getAllByRemoteId(["2-1", "1-1"], state: AssetState.merged),
      ).thenAnswer((_) async => [initialAssets[2]]);
      when(() => assetRepository.getAllByOwnerIdChecksum(any(), any()))
          .thenAnswer((_) async => [initialAssets[0], null, null]); //afg
      final List<Asset> toUpsert = [
        makeAsset(checksum: "a", remoteId: "0-1"), // changed
        makeAsset(checksum: "f", remoteId: "0-2"), // new
        makeAsset(checksum: "g", remoteId: "0-3"), // new
      ];
      toUpsert[0].isFavorite = true;
      final List<String> toDelete = ["2-1", "1-1"];
      final expected = [...toUpsert];
      expected[0].id = initialAssets[0].id;
      final bool c = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: (user, since) async => (toUpsert, toDelete),
        loadAssets: (user, date) => throw Exception(),
      );
      expect(c, isTrue);
      verify(() => assetRepository.updateAll(expected));
    });
  });
}

Future<(List<Asset>?, List<String>?)> _failDiff(
  List<UserDto> user,
  DateTime time,
) =>
    Future.value((null, null));
