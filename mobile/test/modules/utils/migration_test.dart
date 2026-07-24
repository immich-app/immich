import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/entities/trashed_local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/migration.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Drift db;
  late DriftStoreRepository storeRepository;

  setUpAll(() async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    storeRepository = DriftStoreRepository(db);
    await StoreService.init(storeRepository: storeRepository, listenUpdates: false);
  });

  setUp(() async {
    await Store.clear();
    await db.delete(db.localAssetEntity).go();
    await db.delete(db.trashedLocalAssetEntity).go();
    await db.customStatement('DROP TRIGGER IF EXISTS fail_migration');
  });

  tearDownAll(() async {
    debugDefaultTargetPlatformOverride = null;
    await Store.clear();
    await db.close();
  });

  test('stores version 26 when migration 27 fails', () async {
    await Store.put(StoreKey.version, 25);
    await db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: 'asset',
            name: 'asset.jpg',
            type: AssetType.image,
            createdAt: drift.Value(DateTime(2026)),
            updatedAt: drift.Value(DateTime(2025)),
          ),
        );
    await db.customStatement(
      "CREATE TRIGGER fail_migration BEFORE UPDATE OF created_at ON local_asset_entity "
      "BEGIN SELECT RAISE(FAIL, 'migration failed'); END",
    );

    await migrateDatabaseIfNeeded(db);

    expect(await storeRepository.tryGet(StoreKey.version), 26);
  });

  test('fixes dates in active and trashed assets', () async {
    final createdAt = DateTime(2026);
    final updatedAt = DateTime(2025);
    final epoch = DateTime.fromMillisecondsSinceEpoch(0);
    await Store.put(StoreKey.version, 26);
    await db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: 'local',
            name: 'local.jpg',
            type: AssetType.image,
            createdAt: drift.Value(createdAt),
            updatedAt: drift.Value(updatedAt),
          ),
        );
    await db
        .into(db.localAssetEntity)
        .insert(
          LocalAssetEntityCompanion.insert(
            id: 'epoch',
            name: 'epoch.jpg',
            type: AssetType.image,
            createdAt: drift.Value(createdAt),
            updatedAt: drift.Value(epoch),
          ),
        );
    await db
        .into(db.trashedLocalAssetEntity)
        .insert(
          TrashedLocalAssetEntityCompanion.insert(
            id: 'trashed',
            albumId: 'album',
            name: 'trashed.jpg',
            type: AssetType.image,
            createdAt: drift.Value(createdAt),
            updatedAt: drift.Value(updatedAt),
            source: TrashOrigin.localSync,
          ),
        );
    await db
        .into(db.trashedLocalAssetEntity)
        .insert(
          TrashedLocalAssetEntityCompanion.insert(
            id: 'trashed-epoch',
            albumId: 'album',
            name: 'trashed-epoch.jpg',
            type: AssetType.image,
            createdAt: drift.Value(createdAt),
            updatedAt: drift.Value(epoch),
            source: TrashOrigin.localSync,
          ),
        );

    await migrateDatabaseIfNeeded(db);

    final local = await (db.select(db.localAssetEntity)..where((row) => row.id.equals('local'))).getSingle();
    final unchanged = await (db.select(db.localAssetEntity)..where((row) => row.id.equals('epoch'))).getSingle();
    final trashed = await (db.select(db.trashedLocalAssetEntity)..where((row) => row.id.equals('trashed'))).getSingle();
    final trashedUnchanged = await (db.select(
      db.trashedLocalAssetEntity,
    )..where((row) => row.id.equals('trashed-epoch'))).getSingle();
    expect(local.createdAt, updatedAt);
    expect(unchanged.createdAt, createdAt);
    expect(trashed.createdAt, updatedAt);
    expect(trashedUnchanged.createdAt, createdAt);
    expect(await storeRepository.tryGet(StoreKey.version), 27);
  });
}
