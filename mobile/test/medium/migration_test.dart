import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

import 'repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;

  setUp(() {
    ctx = MediumRepositoryContext();
  });

  tearDown(() async {
    await ctx.dispose();
  });

  Future<String?> rawStored(String column, String id) async {
    final row = await ctx.db
        .customSelect('SELECT $column AS v FROM remote_asset_entity WHERE id = ?', variables: [Variable(id)])
        .getSingle();
    return row.readNullable<String>('v');
  }

  group('healOutOfRangeDateTimes', () {
    test('rewrites out-of-range stored text and leaves valid rows untouched', () async {
      final user = await ctx.newUser();
      final farFuture = await ctx.newRemoteAsset(ownerId: user.id);
      final bce = await ctx.newRemoteAsset(ownerId: user.id);
      final yearZero = await ctx.newRemoteAsset(ownerId: user.id);
      final valid = await ctx.newRemoteAsset(ownerId: user.id, createdAt: DateTime.utc(2024, 1, 2, 3, 4, 5, 123));

      // raw sql is the only way poison can exist now: the drift api clamps on write
      await ctx.db.customStatement(
        "UPDATE remote_asset_entity SET created_at = '+144769-11-18T12:38:32.000Z', local_date_time = '+144769-11-18T18:38:32.000 +06:00' WHERE id = ?",
        [farFuture.id],
      );
      await ctx.db.customStatement(
        "UPDATE remote_asset_entity SET created_at = '-004712-03-04T05:06:07.000Z' WHERE id = ?",
        [bce.id],
      );
      await ctx.db.customStatement(
        "UPDATE remote_asset_entity SET created_at = '0000-06-15T10:30:00.000Z' WHERE id = ?",
        [yearZero.id],
      );

      await healOutOfRangeDateTimes(ctx.db);

      expect(await rawStored('created_at', farFuture.id), '9999-12-31T00:00:00.000Z');
      expect(await rawStored('local_date_time', farFuture.id), '9999-12-31T00:00:00.000Z');
      expect(await rawStored('created_at', bce.id), '0001-01-01T00:00:00.000Z');
      expect(await rawStored('created_at', yearZero.id), '0001-01-01T00:00:00.000Z');
      expect(await rawStored('created_at', valid.id), '2024-01-02T03:04:05.123Z');
    });

    test('heals a stored late-9999 value the year predicate missed', () async {
      final user = await ctx.newUser();
      final asset = await ctx.newRemoteAsset(ownerId: user.id);
      // legal by the server's rule, but re-overflows sqlite under 'localtime' east of UTC
      await ctx.db.customStatement(
        "UPDATE remote_asset_entity SET created_at = '9999-12-31T23:59:59.000Z' WHERE id = ?",
        [asset.id],
      );

      await healOutOfRangeDateTimes(ctx.db);
      expect(await rawStored('created_at', asset.id), '9999-12-31T00:00:00.000Z');

      // the healed value itself is not rewritten again
      await healOutOfRangeDateTimes(ctx.db);
      expect(await rawStored('created_at', asset.id), '9999-12-31T00:00:00.000Z');
    });

    test('the merged bucket query crashes before and succeeds after the heal', () async {
      final user = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final asset = await ctx.newLocalAsset(createdAt: DateTime.utc(2024, 1, 2));
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);
      await ctx.db.customStatement(
        "UPDATE local_asset_entity SET created_at = '+144769-11-18T12:38:32.000Z' WHERE id = ?",
        [asset.id],
      );

      // the #28559 class: the native merged bucket reads the NULL bucket date
      final query = ctx.db.mergedAssetDrift.mergedBucket(userIds: [user.id], groupBy: 0);
      await expectLater(query.get(), throwsA(isA<TypeError>()));

      await healOutOfRangeDateTimes(ctx.db);

      final buckets = await query.get();
      expect(buckets, hasLength(1));
      expect(buckets.first.assetCount, 1);
      expect(buckets.first.bucketDate, '9999-12-31');
    });

    test('stores datetimes byte-identical to drift text mapping', () async {
      final user = await ctx.newUser();
      final remote = await ctx.newRemoteAsset(
        ownerId: user.id,
        createdAt: DateTime.utc(2024, 1, 2, 3, 4, 5, 123),
        updatedAt: DateTime.utc(2024, 2, 3, 4, 5, 6, 456),
      );

      expect(await rawStored('created_at', remote.id), '2024-01-02T03:04:05.123Z');
      expect(await rawStored('updated_at', remote.id), '2024-02-03T04:05:06.456Z');

      final local = DateTime(2024, 6, 15, 10, 30, 25);
      final asset = await ctx.newLocalAsset(createdAt: local);
      final row = await (ctx.db.select(ctx.db.localAssetEntity)..where((t) => t.id.equals(asset.id))).getSingle();
      expect(row.createdAt, local);
    });
  });
}
