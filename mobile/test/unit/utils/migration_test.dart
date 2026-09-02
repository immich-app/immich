import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
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
    await Store.put(StoreKey.version, 27);
  });

  tearDownAll(() async {
    await Store.dispose();
    await db.close();
  });

  test('migrates enabled legacy trash sync setting from version 27', () async {
    await _writeRawSetting(db, legacyTrashSyncEnabledKey, 'true');

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.autoSync);
    expect(await _readRawSetting(db, legacyTrashSyncEnabledKey), isNull);
  });

  test('removes disabled legacy trash sync setting from version 27', () async {
    await _writeRawSetting(db, legacyTrashSyncEnabledKey, 'false');

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), isNull);
    expect(await _readRawSetting(db, legacyTrashSyncEnabledKey), isNull);
  });

  test('keeps an existing trash sync mode when removing the legacy setting', () async {
    await _writeSetting(db, SettingsKey.trashSyncMode, TrashSyncMode.review);
    await _writeRawSetting(db, legacyTrashSyncEnabledKey, 'true');

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.review);
    expect(await _readRawSetting(db, legacyTrashSyncEnabledKey), isNull);
  });

  test('keeps the migrated mode when the legacy setting is already gone', () async {
    await _writeRawSetting(db, legacyTrashSyncEnabledKey, 'true');
    await migrateDatabaseIfNeeded(db);

    await Store.put(StoreKey.version, 27);
    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.autoSync);
    expect(await _readRawSetting(db, legacyTrashSyncEnabledKey), isNull);
  });

  group('fresh install migrating from before version 27', () {
    setUp(() => Store.put(StoreKey.version, 26));

    test('carries an enabled legacy manage-media setting into a mode via step 27', () async {
      await Store.put(StoreKey.legacyManageLocalMediaAndroid, true);

      await migrateDatabaseIfNeeded(db);

      expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.autoSync);
      expect(await _readLegacyStoreRow(db, StoreKey.legacyManageLocalMediaAndroid), isNull);
    });

    test('removes a disabled legacy manage-media setting via step 27', () async {
      await Store.put(StoreKey.legacyManageLocalMediaAndroid, false);

      await migrateDatabaseIfNeeded(db);

      expect(await _readSetting(db, SettingsKey.trashSyncMode), isNull);
      expect(await _readLegacyStoreRow(db, StoreKey.legacyManageLocalMediaAndroid), isNull);
    });

    test('removes a stale legacy setting alongside the mode from step 27', () async {
      await Store.put(StoreKey.legacyManageLocalMediaAndroid, true);
      await _writeRawSetting(db, legacyTrashSyncEnabledKey, 'false');

      await migrateDatabaseIfNeeded(db);

      expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.autoSync);
      expect(await _readRawSetting(db, legacyTrashSyncEnabledKey), isNull);
      expect(await _readLegacyStoreRow(db, StoreKey.legacyManageLocalMediaAndroid), isNull);
    });
  });
}

Future<void> _writeRawSetting(Drift db, String key, String value) {
  return db.into(db.settingsEntity).insert(SettingsEntityCompanion.insert(key: key, value: Value(value)));
}

Future<void> _writeSetting<T>(Drift db, SettingsKey<T> key, T value) {
  return _writeRawSetting(db, key.name, key.encode(value));
}

Future<String?> _readRawSetting(Drift db, String key) async =>
    (await (db.settingsEntity.select()..where((row) => row.key.equals(key))).getSingleOrNull())?.value;

Future<T?> _readSetting<T>(Drift db, SettingsKey<T> key) async {
  final row = await (db.settingsEntity.select()..where((row) => row.key.equals(key.name))).getSingleOrNull();
  return row?.value == null ? null : key.decode(row!.value!);
}

Future<StoreEntityData?> _readLegacyStoreRow(Drift db, StoreKey key) {
  return (db.storeEntity.select()..where((row) => row.id.equals(key.id))).getSingleOrNull();
}
