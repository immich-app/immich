import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class SettingsRepository extends DriftDatabaseRepository {
  final Drift _db;

  SettingsRepository._(this._db) : super(_db);

  static SettingsRepository? _instance;

  static SettingsRepository get instance {
    final instance = _instance;
    if (instance == null) {
      throw StateError('SettingsRepository not initialized. Call ensureInitialized() first');
    }
    return instance;
  }

  AppConfig _appConfig = const .new();
  AppConfig get appConfig => _appConfig;

  static Future<SettingsRepository> ensureInitialized(Drift db) async {
    if (_instance == null) {
      final instance = SettingsRepository._(db);
      await instance.refresh();
      _instance = instance;
    }
    return _instance!;
  }

  Future<void> refresh() async => _applyOverrides(await _db.select(_db.settingsEntity).get());

  Future<void> clear(Iterable<SettingsKey> keys) async {
    if (keys.isEmpty) {
      return;
    }

    final names = keys.map((key) => key.name).toList();
    await (_db.delete(_db.settingsEntity)..where((row) => row.key.isIn(names))).go();

    for (final key in keys) {
      _appConfig = _appConfig.write(key, defaultConfig.read(key));
    }
  }

  Future<void> write<T extends Object, U extends T>(SettingsKey<T> key, U value) async {
    if (value == _appConfig.read(key)) {
      return;
    }

    if (value == defaultConfig.read(key)) {
      return clear([key]);
    }

    await _db
        .into(_db.settingsEntity)
        .insertOnConflictUpdate(
          SettingsEntityCompanion.insert(key: key.name, value: key.encode(value), updatedAt: Value(DateTime.now())),
        );
    _appConfig = _appConfig.write(key, value);
  }

  Stream<AppConfig> watchConfig() => _db.select(_db.settingsEntity).watch().map((rows) {
    _applyOverrides(rows);
    return _appConfig;
  });

  void _applyOverrides(List<SettingsEntityData> rows) {
    _appConfig = AppConfig.fromEntries(
      rows.fold({}, (overrides, row) {
        final metadataKey = SettingsKey.values.firstWhereOrNull((key) => key.name == row.key);
        if (metadataKey == null) {
          return overrides;
        }

        return {...overrides, metadataKey: metadataKey.decode(row.value)};
      }),
    );
  }
}
