import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:isar/isar.dart';

import '../../test_utils.dart';
import 'shared_mocks.dart';

void main() {
  Asset makeAsset({
    required String checksum,
    String? localId,
    String? remoteId,
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
      isTrashed: false,
      stackCount: 0,
    );
  }

  group('Test SyncService grouped', () {
    late final Isar db;
    final MockHashService hs = MockHashService();
    final owner = User(
      id: "1",
      updatedAt: DateTime.now(),
      email: "a@b.c",
      name: "first last",
      isAdmin: false,
    );
    setUpAll(() async {
      WidgetsFlutterBinding.ensureInitialized();
      db = await TestUtils.initIsar();
      ImmichLogger();
      db.writeTxnSync(() => db.clearSync());
      Store.init(db);
      await Store.put(StoreKey.currentUser, owner);
    });
    final List<Asset> initialAssets = [
      makeAsset(checksum: "a", remoteId: "0-1"),
      makeAsset(checksum: "b", remoteId: "2-1"),
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
        makeAsset(checksum: "a", remoteId: "0-1"),
        makeAsset(checksum: "b", remoteId: "2-1"),
        makeAsset(checksum: "c", remoteId: "1-1"),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
        refreshUsers: () => [owner],
      );
      expect(c1, isFalse);
      expect(db.assets.countSync(), 5);
    });

    test('test inserting new assets', () async {
      SyncService s = SyncService(db, hs);
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1"),
        makeAsset(checksum: "b", remoteId: "2-1"),
        makeAsset(checksum: "c", remoteId: "1-1"),
        makeAsset(checksum: "d", remoteId: "1-2"),
        makeAsset(checksum: "f", remoteId: "1-4"),
        makeAsset(checksum: "g", remoteId: "3-1"),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
        refreshUsers: () => [owner],
      );
      expect(c1, isTrue);
      expect(db.assets.countSync(), 7);
    });

    test('test syncing duplicate assets', () async {
      SyncService s = SyncService(db, hs);
      final List<Asset> remoteAssets = [
        makeAsset(checksum: "a", remoteId: "0-1"),
        makeAsset(checksum: "b", remoteId: "1-1"),
        makeAsset(checksum: "c", remoteId: "2-1"),
        makeAsset(checksum: "h", remoteId: "2-1b"),
        makeAsset(checksum: "i", remoteId: "2-1c"),
        makeAsset(checksum: "j", remoteId: "2-1d"),
      ];
      expect(db.assets.countSync(), 5);
      final bool c1 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
        refreshUsers: () => [owner],
      );
      expect(c1, isTrue);
      expect(db.assets.countSync(), 8);
      final bool c2 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
        refreshUsers: () => [owner],
      );
      expect(c2, isFalse);
      expect(db.assets.countSync(), 8);
      remoteAssets.removeAt(4);
      final bool c3 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
        refreshUsers: () => [owner],
      );
      expect(c3, isTrue);
      expect(db.assets.countSync(), 7);
      remoteAssets.add(makeAsset(checksum: "k", remoteId: "2-1e"));
      remoteAssets.add(makeAsset(checksum: "l", remoteId: "2-2"));
      final bool c4 = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: _failDiff,
        loadAssets: (u, d) => remoteAssets,
        refreshUsers: () => [owner],
      );
      expect(c4, isTrue);
      expect(db.assets.countSync(), 9);
    });

    test('test efficient sync', () async {
      SyncService s = SyncService(db, hs);
      final List<Asset> toUpsert = [
        makeAsset(checksum: "a", remoteId: "0-1"), // changed
        makeAsset(checksum: "f", remoteId: "0-2"), // new
        makeAsset(checksum: "g", remoteId: "0-3"), // new
      ];
      toUpsert[0].isFavorite = true;
      final List<String> toDelete = ["2-1", "1-1"];
      final bool c = await s.syncRemoteAssetsToDb(
        users: [owner],
        getChangedAssets: (user, since) async => (toUpsert, toDelete),
        loadAssets: (user, date) => throw Exception(),
        refreshUsers: () => throw Exception(),
      );
      expect(c, isTrue);
      expect(db.assets.countSync(), 6);
    });
  });
}

Future<(List<Asset>?, List<String>?)> _failDiff(
  List<User> user,
  DateTime time,
) =>
    Future.value((null, null));
