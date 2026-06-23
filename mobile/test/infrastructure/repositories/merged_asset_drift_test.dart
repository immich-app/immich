import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';

void main() {
  late Drift db;

  setUp(() {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
  });

  tearDown(() async {
    await db.close();
  });

  Future<void> insertUser(String id) =>
      db.into(db.userEntity).insert(UserEntityCompanion.insert(id: id, email: '$id@test.dev', name: id));

  Future<void> insertRemote(
    String id,
    String ownerId, {
    required String checksum,
    required DateTime at,
    DateTime? deletedAt,
  }) => db
      .into(db.remoteAssetEntity)
      .insert(
        RemoteAssetEntityCompanion.insert(
          id: id,
          name: '$id.jpg',
          type: AssetType.image,
          checksum: checksum,
          ownerId: ownerId,
          visibility: AssetVisibility.timeline,
          createdAt: Value(at),
          updatedAt: Value(at),
          uploadedAt: Value(at),
          deletedAt: Value(deletedAt),
        ),
      );

  Future<void> insertLocal(String id, {required DateTime at, String? checksum, String? priorRemoteId}) => db
      .into(db.localAssetEntity)
      .insert(
        LocalAssetEntityCompanion.insert(
          id: id,
          name: '$id.jpg',
          type: AssetType.image,
          checksum: Value(checksum),
          priorRemoteId: Value(priorRemoteId),
          createdAt: Value(at),
          updatedAt: Value(at),
        ),
      );

  Future<void> insertSelectedAlbumWith(String albumId, List<String> assetIds) async {
    await db
        .into(db.localAlbumEntity)
        .insert(
          LocalAlbumEntityCompanion.insert(id: albumId, name: albumId, backupSelection: BackupSelection.selected),
        );
    for (final assetId in assetIds) {
      await db
          .into(db.localAlbumAssetEntity)
          .insert(LocalAlbumAssetEntityCompanion.insert(assetId: assetId, albumId: albumId));
    }
  }

  test('mergedBucket falls back to createdAt when localDateTime is null', () async {
    const userId = 'user-1';
    final createdAt = DateTime(2024, 1, 1, 12);

    await insertUser(userId);

    await db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: 'asset-1',
            name: 'asset-1.jpg',
            type: AssetType.image,
            checksum: 'checksum-1',
            ownerId: userId,
            visibility: AssetVisibility.timeline,
            createdAt: Value(createdAt),
            updatedAt: Value(createdAt),
            uploadedAt: Value(createdAt),
            localDateTime: const Value(null),
          ),
        );

    final buckets = await db.mergedAssetDrift.mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId]).get();

    expect(buckets, hasLength(1));
    expect(buckets.single.assetCount, 1);
    expect(buckets.single.bucketDate, isNotEmpty);
  });

  // Reproduces the on-server shape of an edited live photo: 2 stills stacked
  // (primary = the edit) + 2 hidden motion videos. The hidden videos must never
  // become timeline tiles, and the stack collapses to its primary still.
  test('edited live photo: hidden motion videos excluded, stack collapses to its primary', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    await db
        .into(db.stackEntity)
        .insert(StackEntityCompanion.insert(id: 'stack-1', ownerId: userId, primaryAssetId: 'edit-still'));

    Future<void> ins(String id, AssetType type, AssetVisibility vis, {String? lpv, String? stackId}) => db
        .into(db.remoteAssetEntity)
        .insert(
          RemoteAssetEntityCompanion.insert(
            id: id,
            name: '$id.x',
            type: type,
            checksum: 'cs-$id',
            ownerId: userId,
            visibility: vis,
            createdAt: Value(t),
            updatedAt: Value(t),
            uploadedAt: Value(t),
            livePhotoVideoId: Value(lpv),
            stackId: Value(stackId),
          ),
        );

    await ins('orig-still', AssetType.image, AssetVisibility.timeline, lpv: 'orig-video', stackId: 'stack-1');
    await ins('edit-still', AssetType.image, AssetVisibility.timeline, lpv: 'edit-video', stackId: 'stack-1');
    await ins('orig-video', AssetType.video, AssetVisibility.hidden);
    await ins('edit-video', AssetType.video, AssetVisibility.hidden);

    final rows = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();
    final ids = rows.map((r) => r.remoteId).toList();

    expect(ids, isNot(contains('edit-video')), reason: 'hidden edit motion video must not be a timeline tile');
    expect(ids, isNot(contains('orig-video')), reason: 'hidden orig motion video must not be a timeline tile');
    expect(ids, isNot(contains('orig-still')), reason: 'non-primary stack member collapses behind the primary');
    expect(ids, ['edit-still'], reason: 'the stack shows exactly once, as its primary');
  });

  test('local tile hidden when prior_remote_id points at a live remote', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    await insertRemote('live-remote', userId, checksum: 'cs-server', at: t);
    // re-encoded bytes: checksum no longer matches the remote, but prior does
    await insertLocal('hidden-local', at: t, checksum: 'cs-rerendered', priorRemoteId: 'live-remote');
    await insertLocal('plain-local', at: t);
    await insertSelectedAlbumWith('album-1', ['hidden-local', 'plain-local']);

    final rows = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();
    final localOnlyIds = rows.where((r) => r.remoteId == null).map((r) => r.localId).toList();

    expect(localOnlyIds, isNot(contains('hidden-local')), reason: 'local already live on server must not get a tile');
    expect(localOnlyIds, contains('plain-local'));
    expect(rows, hasLength(2));

    final buckets = await db.mergedAssetDrift.mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId]).get();
    final bucketTotal = buckets.fold<int>(0, (sum, b) => sum + b.assetCount);
    expect(bucketTotal, rows.length, reason: 'bucket counts must match the visible tiles');
  });

  test('local tile hidden when the prior remote is trashed', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    await insertRemote('trashed-remote', userId, checksum: 'cs-server', at: t, deletedAt: t);
    await insertLocal('local-1', at: t, checksum: 'cs-rerendered', priorRemoteId: 'trashed-remote');
    await insertSelectedAlbumWith('album-1', ['local-1']);

    final rows = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();
    expect(rows, isEmpty, reason: 'trashing on the server must not pop the photo back onto the local timeline');

    final buckets = await db.mergedAssetDrift.mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId]).get();
    expect(buckets, isEmpty);
  });

  test('local tile shows again when the prior remote row is gone', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    // hard delete: sync removed the remote row entirely, only that re-opens the local
    await insertLocal('local-1', at: t, checksum: 'cs-rerendered', priorRemoteId: 'gone-remote');
    await insertSelectedAlbumWith('album-1', ['local-1']);

    final rows = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();
    expect(rows, hasLength(1));
    expect(rows.single.remoteId, null);
    expect(rows.single.localId, 'local-1');

    final buckets = await db.mergedAssetDrift.mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId]).get();
    expect(buckets.fold<int>(0, (sum, b) => sum + b.assetCount), 1);
  });

  test('remote row falls back to prior_remote_id for local_id and local_checksum', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    await insertRemote('remote-1', userId, checksum: 'cs-server', at: t);
    await insertLocal('local-1', at: t, checksum: 'cs-on-device', priorRemoteId: 'remote-1');

    final rows = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();
    final row = rows.single;

    expect(row.remoteId, 'remote-1');
    expect(row.localId, 'local-1');
    expect(row.localChecksum, 'cs-on-device', reason: 'local render key must be the on-device bytes');
    expect(row.checksum, 'cs-server');
  });

  test('checksum match links local_id and local_checksum', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    await insertRemote('remote-1', userId, checksum: 'cs-same', at: t);
    await insertLocal('local-1', at: t, checksum: 'cs-same');

    final rows = await db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();
    final row = rows.single;

    expect(row.remoteId, 'remote-1');
    expect(row.localId, 'local-1');
    expect(row.localChecksum, 'cs-same');
    expect(row.localChecksum, row.checksum);
  });

  test('timeline repository maps local_checksum into RemoteAsset.localChecksum', () async {
    const userId = 'user-1';
    final t = DateTime(2026, 6, 8, 9);
    await insertUser(userId);
    await insertRemote('remote-match', userId, checksum: 'cs-same', at: t);
    await insertLocal('local-match', at: t, checksum: 'cs-same');
    await insertRemote('remote-prior', userId, checksum: 'cs-server', at: t);
    await insertLocal('local-prior', at: t, checksum: 'cs-on-device', priorRemoteId: 'remote-prior');

    final assets = await DriftTimelineRepository(db).main([userId], GroupAssetsBy.day).assetSource(0, 100);
    final byId = {for (final a in assets.whereType<RemoteAsset>()) a.id: a};

    expect(byId, hasLength(2));
    expect(byId['remote-match']?.localChecksum, 'cs-same');
    expect(byId['remote-prior']?.localChecksum, 'cs-on-device', reason: 'prior-linked local with re-encoded bytes');
  });
}
