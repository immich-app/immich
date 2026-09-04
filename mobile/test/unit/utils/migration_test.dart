import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/store.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/migration.dart';

void main() {
  late Drift db;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
  });

  setUp(() async {
    await Store.clear();
    await db.settingsEntity.deleteAll();
    await Store.put(StoreKey.version, 26);
  });

  tearDownAll(() async {
    await Store.dispose();
    await db.close();
  });

  test('migrates enabled legacy manage-media setting directly to auto sync', () async {
    await Store.put(StoreKey.legacyManageLocalMediaAndroid, true);

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.autoSync);
    expect(await _readLegacyStoreRow(db, StoreKey.legacyManageLocalMediaAndroid), isNull);
    expect(Store.get(StoreKey.version), 27);
  });

  test('removes disabled legacy manage-media setting without storing the default mode', () async {
    await Store.put(StoreKey.legacyManageLocalMediaAndroid, false);

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), isNull);
    expect(await _readLegacyStoreRow(db, StoreKey.legacyManageLocalMediaAndroid), isNull);
    expect(Store.get(StoreKey.version), 27);
  });

  test('leaves trash sync mode unset when the legacy setting is absent', () async {
    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), isNull);
    expect(Store.get(StoreKey.version), 27);
  });
}

Future<T?> _readSetting<T>(Drift db, SettingsKey<T> key) async {
  final row = await (db.settingsEntity.select()..where((row) => row.key.equals(key.name))).getSingleOrNull();
  return row?.value == null ? null : key.decode(row!.value!);
}

Future<StoreEntityData?> _readLegacyStoreRow(Drift db, StoreKey key) {
  return (db.storeEntity.select()..where((row) => row.id.equals(key.id))).getSingleOrNull();
}
