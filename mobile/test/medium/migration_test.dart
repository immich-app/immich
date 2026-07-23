import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/migration.dart';

import 'repository_context.dart';

void main() {
  late MediumRepositoryContext ctx;

  setUp(() {
    ctx = MediumRepositoryContext();
  });

  tearDown(() async {
    await ctx.dispose();
  });

  group('migrateTo27', () {
    Future<bool> bucketDateIsNull(String column, String id) async {
      final row = await ctx.db
          .customSelect(
            "SELECT STRFTIME('%Y-%m-%d', $column) AS date FROM local_asset_entity WHERE id = ?",
            variables: [Variable<String>(id)],
          )
          .getSingle();
      return row.readNullable<String>('date') == null;
    }

    test('resets a local asset whose year exceeds SQLite range', () async {
      final asset = await ctx.newLocalAsset(createdAt: DateTime.utc(50000, 6, 15));
      expect(
        await bucketDateIsNull('created_at', asset.id),
        isTrue,
        reason: 'precondition: row must not be parseable by SQLite',
      );

      await migrateTo27(ctx.db);

      final createdAtRow = await (ctx.db.localAssetEntity.select()..where((t) => t.id.equals(asset.id))).getSingle();
      final createdAt = createdAtRow.createdAt;
      expect(createdAt.year, lessThanOrEqualTo(9999));
      expect(await bucketDateIsNull('created_at', asset.id), isFalse);
    });

    test('resets an out of range updated_at', () async {
      final asset = await ctx.newLocalAsset(updatedAt: DateTime.utc(60000, 1, 1));
      expect(await bucketDateIsNull('updated_at', asset.id), isTrue);

      await migrateTo27(ctx.db);

      expect(await bucketDateIsNull('updated_at', asset.id), isFalse);
    });

    test('valid datetime values are untouched', () async {
      final original = DateTime.utc(2024, 1, 2, 3, 4, 5);
      final asset = await ctx.newLocalAsset(createdAt: original);

      await migrateTo27(ctx.db);

      final createdAtRow = await (ctx.db.localAssetEntity.select()..where((t) => t.id.equals(asset.id))).getSingle();
      expect(createdAtRow.createdAt, original);
    });

    test('the timeline bucket query crashes before but succeeds after the migration', () async {
      final user = await ctx.newUser();
      final album = await ctx.newLocalAlbum(backupSelection: .selected);
      final asset = await ctx.newLocalAsset(createdAt: .utc(50000, 6, 15));
      await ctx.newLocalAlbumAsset(albumId: album.id, assetId: asset.id);

      final query = ctx.db.mergedAssetDrift.mergedBucket(userIds: [user.id], groupBy: 0);

      await expectLater(query.get(), throwsA(isA<TypeError>()));

      await migrateTo27(ctx.db);

      final buckets = await query.get();
      expect(buckets, hasLength(1));
      expect(buckets.first.assetCount, 1);
    });
  });
}
