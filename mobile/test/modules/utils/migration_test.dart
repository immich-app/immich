import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
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
}
