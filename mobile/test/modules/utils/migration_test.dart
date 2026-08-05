import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/migration.dart';

import '../../medium/repository_context.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MediumRepositoryContext ctx;

  setUpAll(() async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    ctx = MediumRepositoryContext();
    await StoreService.init(storeRepository: DriftStoreRepository(ctx.db), listenUpdates: false);
  });

  setUp(() async {
    await Store.clear();
    await ctx.db.delete(ctx.db.localAssetEntity).go();
    await ctx.db.delete(ctx.db.trashedLocalAssetEntity).go();
    await ctx.db.customStatement('DROP TRIGGER IF EXISTS fail_migration');
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await ctx.dispose();
  });

  test('stores version 26 when migration 27 fails', () async {
    await Store.put(StoreKey.version, 25);
    await ctx.newLocalAsset(id: 'asset', createdAt: DateTime(2026), updatedAt: DateTime(2025));
    await ctx.db.customStatement(
      "CREATE TRIGGER fail_migration BEFORE UPDATE OF created_at ON local_asset_entity "
      "BEGIN SELECT RAISE(FAIL, 'migration failed'); END",
    );

    await migrateDatabaseIfNeeded(ctx.db);

    expect(Store.tryGet(StoreKey.version), 26);
  });

  test('fixes dates in active and trashed assets', () async {
    final createdAt = DateTime(2026);
    final updatedAt = DateTime(2025);
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    await Store.put(StoreKey.version, 26);
    await ctx.newLocalAsset(id: 'local', createdAt: createdAt, updatedAt: updatedAt);
    await ctx.newLocalAsset(id: 'epoch', createdAt: createdAt, updatedAt: epoch);
    await ctx.newTrashedLocalAsset(
      id: 'trashed',
      albumId: 'album',
      createdAt: createdAt,
      updatedAt: updatedAt,
      source: TrashOrigin.localSync,
    );
    await ctx.newTrashedLocalAsset(
      id: 'trashed-epoch',
      albumId: 'album',
      createdAt: createdAt,
      updatedAt: epoch,
      source: TrashOrigin.localSync,
    );

    await migrateDatabaseIfNeeded(ctx.db);

    final local = await (ctx.db.select(ctx.db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    final unchanged = await (ctx.db.select(
      ctx.db.localAssetEntity,
    )..where((row) => row.id.equals('epoch'))).getSingle();
    final trashed = await (ctx.db.select(
      ctx.db.trashedLocalAssetEntity,
    )..where((row) => row.id.equals('trashed'))).getSingle();
    final trashedUnchanged = await (ctx.db.select(
      ctx.db.trashedLocalAssetEntity,
    )..where((row) => row.id.equals('trashed-epoch'))).getSingle();
    expect(local.createdAt, updatedAt);
    expect(unchanged.createdAt, createdAt);
    expect(trashed.createdAt, updatedAt);
    expect(trashedUnchanged.createdAt, createdAt);
    expect(Store.tryGet(StoreKey.version), 27);
  });
}
