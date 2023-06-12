import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/logger_message.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/services/hash.service.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:isar/isar.dart';
import 'package:mockito/mockito.dart';

void main() {
  Asset makeAsset({
    required String checksum,
    String? localId,
    String? remoteId,
    int deviceId = 1,
    int ownerId = 590700560494856554, // hash of "1"
  }) {
    final DateTime date = DateTime(2000);
    return Asset(
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
    );
  }

  Isar loadDb() {
    return Isar.openSync(
      [
        ExifInfoSchema,
        AssetSchema,
        AlbumSchema,
        UserSchema,
        StoreValueSchema,
        LoggerMessageSchema
      ],
      maxSizeMiB: 256,
      directory: ".",
    );
  }

  group('Test SyncService grouped', () {
    late final Isar db;
    final MockHashService hs = MockHashService();
    final owner = User(
      id: "1",
      updatedAt: DateTime.now(),
      email: "a@b.c",
      firstName: "first",
      lastName: "last",
      isAdmin: false,
    );
    setUpAll(() async {
      WidgetsFlutterBinding.ensureInitialized();
      await Isar.initializeIsarCore(download: true);
      db = loadDb();
      ImmichLogger();
      db.writeTxnSync(() => db.clearSync());
      Store.init(db);
      await Store.put(StoreKey.currentUser, owner);
    });
    final List<Asset> initialAssets = [
      makeAsset(checksum: "a", remoteId: "0-1", deviceId: 0),
      makeAsset(checksum: "b", remoteId: "2-1", deviceId: 2),
      makeAsset(checksum: "c", localId: "1", remoteId: "1-1"),
      makeAsset(checksum: "d", localId: "2"),
      makeAsset(checksum: "e", localId: "3"),
    ];
    setUp(() {
      db.writeTxnSync(() {
        db.assets.clearSync();
        db.assets.putAllSync(initialAssets);
      });
    });
    test('test inserting existing assets', () async {
      SyncService s = SyncService(db, hs);
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1", deviceId: 0),
        makeAsset(checksum: "b", remoteId: "2-1", deviceId: 2),
        makeAsset(checksum: "c", remoteId: "1-1"),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c1, false);
      expect(db.assets.countSync(), 5);
    });

    test('test inserting new assets', () async {
      SyncService s = SyncService(db, hs);
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1", deviceId: 0),
        makeAsset(checksum: "b", remoteId: "2-1", deviceId: 2),
        makeAsset(checksum: "c", remoteId: "1-1"),
        makeAsset(checksum: "d", remoteId: "1-2"),
        makeAsset(checksum: "f", remoteId: "1-4"),
        makeAsset(checksum: "g", remoteId: "3-1", deviceId: 3),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c1, true);
      expect(db.assets.countSync(), 7);
    });

    test('test syncing duplicate assets', () async {
      SyncService s = SyncService(db, hs);
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1", deviceId: 0),
        makeAsset(checksum: "b", remoteId: "1-1"),
        makeAsset(checksum: "c", remoteId: "2-1", deviceId: 2),
        makeAsset(checksum: "h", remoteId: "2-1b", deviceId: 2),
        makeAsset(checksum: "i", remoteId: "2-1c", deviceId: 2),
        makeAsset(checksum: "j", remoteId: "2-1d", deviceId: 2),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c1, true);
      expect(db.assets.countSync(), 8);
      final bool c2 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c2, false);
      expect(db.assets.countSync(), 8);
      remoteAssets.removeAt(4);
      final bool c3 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c3, true);
      expect(db.assets.countSync(), 7);
      remoteAssets.add(makeAsset(checksum: "k", remoteId: "2-1e", deviceId: 2));
      remoteAssets.add(makeAsset(checksum: "l", remoteId: "2-2", deviceId: 2));
      final bool c4 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c4, true);
      expect(db.assets.countSync(), 9);
    });
  });
}

class MockHashService extends Mock implements HashService {}
