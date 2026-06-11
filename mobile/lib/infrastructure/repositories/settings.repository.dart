import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/entities/settings.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/cached_key_value_repository.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class SettingsRepository extends CachedKeyValueRepository<SettingsKey, AppConfig> {
  final Drift _db;

  SettingsRepository._(this._db) : super(const .new());

  static SettingsRepository? _instance;

  static SettingsRepository get instance {
    final instance = _instance;
    if (instance == null) {
      throw StateError('SettingsRepository not initialized. Call ensureInitialized() first');
    }
    return instance;
  }

  static Future<SettingsRepository> ensureInitialized(Drift db) async {
    if (_instance == null) {
      final instance = SettingsRepository._(db);
      await instance.refresh();
      _instance = instance;
    }
    return _instance!;
  }

  @override
  List<SettingsKey> get keys => SettingsKey.values;

  @override
  Object decodeValue(SettingsKey key, String raw) => key.decode(raw);

  @override
  AppConfig buildSnapshot(Map<SettingsKey, Object?> overrides) => AppConfig.fromEntries(overrides);

  @override
  Selectable<({String key, String? value})> selectable() =>
      _db.select(_db.settingsEntity).map((row) => (key: row.key, value: row.value));

  AppConfig get appConfig => snapshot;

  Future<void> clear(Iterable<SettingsKey> keys) async {
    if (keys.isEmpty) {
      return;
    }

    final names = keys.map((key) => key.name).toList();
    await (_db.delete(_db.settingsEntity)..where((row) => row.key.isIn(names))).go();

    var config = snapshot;
    for (final key in keys) {
      config = config.write(key, defaultConfig.read(key));
    }
    snapshot = config;
  }

  Future<void> write<T, U extends T>(SettingsKey<T> key, U value) async {
    if (value == snapshot.read(key)) {
      return;
    }

    if (value == defaultConfig.read(key)) {
      return clear([key]);
    }

    String? resolvedValue;
    if (value != null) {
      resolvedValue = key.encode(value);
    }

    await _db
        .into(_db.settingsEntity)
        .insertOnConflictUpdate(
          SettingsEntityCompanion.insert(key: key.name, value: .new(resolvedValue), updatedAt: .new(DateTime.now())),
        );
    snapshot = snapshot.write(key, value);
  }

  Stream<AppConfig> watchConfig() => watchSnapshot();
}
