import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/utils/option.dart';

import '../../medium/repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;
  late String userId;

  setUp(() async {
    ctx = MediumRepositoryContext();
    userId = (await ctx.newUser()).id;
  });

  tearDown(() async {
    await ctx.dispose();
  });

  Future<void> addRemote(String id, {required DateTime createdAt, DateTime? localDateTime}) async {
    await ctx.newRemoteAsset(
      id: id,
      ownerId: userId,
      createdAt: createdAt,
      localDateTimeOption: Option.fromNullable(localDateTime),
    );
  }

  // the timeline pairs headers to assets by running offset into one flat list
  Future<List<(String, String)>> headerForEachAsset(GroupAssetsBy groupBy) async {
    final buckets = await ctx.db.mergedAssetDrift.mergedBucket(groupBy: groupBy.index, userIds: [userId]).get();
    final assets = await ctx.db.mergedAssetDrift.mergedAsset(userIds: [userId], limit: (_) => Limit(1000, 0)).get();

    final pairs = <(String, String)>[];
    var offset = 0;
    for (final bucket in buckets) {
      for (final asset in assets.skip(offset).take(bucket.assetCount)) {
        pairs.add(((asset.remoteId ?? asset.localId)!, bucket.bucketDate!));
      }
      offset += bucket.assetCount;
    }
    return pairs;
  }

  test('assets stay under their headers and deleting an asset removes its empty header', () async {
    await addRemote('asset-a', createdAt: DateTime(2026, 4, 26, 10));
    await addRemote('asset-b', createdAt: DateTime(2026, 4, 26, 12));
    await addRemote('ghost', createdAt: DateTime(2026, 4, 26, 11), localDateTime: DateTime.utc(2027, 3, 4, 12));

    expect(await headerForEachAsset(GroupAssetsBy.day), [
      ('ghost', '2027-03-04'),
      ('asset-b', '2026-04-26'),
      ('asset-a', '2026-04-26'),
    ]);

    await ctx.db.remoteAssetEntity.deleteWhere((row) => row.id.equals('ghost'));
    final buckets = await ctx.db.mergedAssetDrift
        .mergedBucket(groupBy: GroupAssetsBy.day.index, userIds: [userId])
        .get();
    expect(buckets.map((b) => b.bucketDate), ['2026-04-26']);
    expect(buckets.single.assetCount, 2);
  });

  test('same-day assets order by createdAt like the web timeline', () async {
    await addRemote(
      'shot-late-upload-early',
      createdAt: DateTime.utc(2026, 7, 24, 1),
      localDateTime: DateTime.utc(2026, 7, 24, 22),
    );
    await addRemote(
      'shot-early-upload-late',
      createdAt: DateTime.utc(2026, 7, 24, 15),
      localDateTime: DateTime.utc(2026, 7, 24, 8),
    );

    expect(await headerForEachAsset(GroupAssetsBy.day), [
      ('shot-early-upload-late', '2026-07-24'),
      ('shot-late-upload-early', '2026-07-24'),
    ]);
  });

  test('device only assets are interleaved with remote assets by the date shown', () async {
    await addRemote('remote', createdAt: DateTime.utc(2024, 4, 26, 3), localDateTime: DateTime.utc(2024, 4, 26, 10));
    await ctx.newLocalAlbum(id: 'album', backupSelection: .selected);
    await ctx.newLocalAsset(id: 'device', createdAt: DateTime(2024, 4, 26, 14));
    await ctx.newLocalAlbumAsset(albumId: 'album', assetId: 'device');
    await addRemote('older', createdAt: DateTime.utc(2024, 4, 25, 3), localDateTime: DateTime.utc(2024, 4, 25, 10));

    expect(await headerForEachAsset(GroupAssetsBy.day), [
      ('device', '2024-04-26'),
      ('remote', '2024-04-26'),
      ('older', '2024-04-25'),
    ]);
  });

  test('month grouping keeps every asset under its own month header', () async {
    await addRemote('may', createdAt: DateTime.utc(2024, 4, 30, 23), localDateTime: DateTime.utc(2024, 5, 1, 8));
    await addRemote('april', createdAt: DateTime.utc(2024, 5, 1, 1), localDateTime: DateTime.utc(2024, 4, 30, 20));

    expect(await headerForEachAsset(GroupAssetsBy.month), [('may', '2024-05'), ('april', '2024-04')]);
  });
}
