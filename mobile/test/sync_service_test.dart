import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/logger_message.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:isar/isar.dart';

void main() {
  Asset makeAsset({
    required String localId,
    String? remoteId,
    int deviceId = 1,
    int ownerId = 590700560494856554, // hash of "1"
    bool isLocal = false,
  }) {
    final DateTime date = DateTime(2000);
    return Asset(
      localId: localId,
      remoteId: remoteId,
      deviceId: deviceId,
      ownerId: ownerId,
      fileCreatedAt: date,
      fileModifiedAt: date,
      updatedAt: date,
      durationInSeconds: 0,
      type: AssetType.image,
      fileName: localId,
      isFavorite: false,
      isLocal: isLocal,
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
    );
  }

  group('Test SyncService grouped', () {
    late final Isar db;
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
      makeAsset(localId: "1", remoteId: "0-1", deviceId: 0),
      makeAsset(localId: "1", remoteId: "2-1", deviceId: 2),
      makeAsset(localId: "1", remoteId: "1-1", isLocal: true),
      makeAsset(localId: "2", isLocal: true),
      makeAsset(localId: "3", isLocal: true),
    ];
    setUp(() {
      db.writeTxnSync(() {
        db.assets.clearSync();
        db.assets.putAllSync(initialAssets);
      });
    });
    test('test inserting existing assets', () async {
      SyncService s = SyncService(db);
      final List<Asset> remoteAssets = [
        makeAsset(localId: "1", remoteId: "0-1", deviceId: 0),
        makeAsset(localId: "1", remoteId: "2-1", deviceId: 2),
        makeAsset(localId: "1", remoteId: "1-1"),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c1, false);
      expect(db.assets.countSync(), 5);
    });

    test('test inserting new assets', () async {
      SyncService s = SyncService(db);
      final List<Asset> remoteAssets = [
        makeAsset(localId: "1", remoteId: "0-1", deviceId: 0),
        makeAsset(localId: "1", remoteId: "2-1", deviceId: 2),
        makeAsset(localId: "1", remoteId: "1-1"),
        makeAsset(localId: "2", remoteId: "1-2"),
        makeAsset(localId: "4", remoteId: "1-4"),
        makeAsset(localId: "1", remoteId: "3-1", deviceId: 3),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c1, true);
      expect(db.assets.countSync(), 7);
    });

    test('test syncing duplicate assets', () async {
      SyncService s = SyncService(db);
      final List<Asset> remoteAssets = [
        makeAsset(localId: "1", remoteId: "0-1", deviceId: 0),
        makeAsset(localId: "1", remoteId: "1-1"),
        makeAsset(localId: "1", remoteId: "2-1", deviceId: 2),
        makeAsset(localId: "1", remoteId: "2-1b", deviceId: 2),
        makeAsset(localId: "1", remoteId: "2-1c", deviceId: 2),
        makeAsset(localId: "1", remoteId: "2-1d", deviceId: 2),
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
      remoteAssets.add(makeAsset(localId: "1", remoteId: "2-1e", deviceId: 2));
      remoteAssets.add(makeAsset(localId: "2", remoteId: "2-2", deviceId: 2));
      final bool c4 = await s.syncRemoteAssetsToDb(owner, () => remoteAssets);
      expect(c4, true);
      expect(db.assets.countSync(), 9);
    });
  });
}
