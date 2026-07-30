import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/utils/migration.dart';

void main() {
  late Drift db;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
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
    await _writeSetting(db, SettingsKey.trashSyncEnabled, true);

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), TrashSyncMode.autoSync);
    expect(await _readSetting(db, SettingsKey.trashSyncEnabled), isNull);
  });

  test('removes disabled legacy trash sync setting without creating a mode', () async {
    await _writeSetting(db, SettingsKey.trashSyncEnabled, false);

    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), isNull);
    expect(await _readSetting(db, SettingsKey.trashSyncEnabled), isNull);
  });

  test('leaves an absent legacy trash sync setting at the default mode', () async {
    await migrateDatabaseIfNeeded(db);

    expect(await _readSetting(db, SettingsKey.trashSyncMode), isNull);
    expect(await _readSetting(db, SettingsKey.trashSyncEnabled), isNull);
  });
}

Future<void> _writeSetting<T>(Drift db, SettingsKey<T> key, T value) {
  return db
      .into(db.settingsEntity)
      .insert(SettingsEntityCompanion.insert(key: key.name, value: Value(key.encode(value))));
}

Future<T?> _readSetting<T>(Drift db, SettingsKey<T> key) async {
  final row = await (db.settingsEntity.select()..where((row) => row.key.equals(key.name))).getSingleOrNull();
  return row?.value == null ? null : key.decode(row!.value!);
}
