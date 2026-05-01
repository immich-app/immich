import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class MetadataRepository extends DriftDatabaseRepository {
  final Drift _db;
  final Map<MetadataKey, Object> _cache = {};

  MetadataRepository._(this._db) : super(_db);

  static MetadataRepository? _instance;

  static MetadataRepository get instance {
    final instance = _instance;
    if (instance == null) {
      throw StateError('MetadataRepository not initialized. Call ensureInitialized() first');
    }
    return instance;
  }

  AppConfig _appConfig = const .new();
  AppConfig get appConfig => _appConfig;

  SystemConfig _systemConfig = const .new();
  SystemConfig get systemConfig => _systemConfig;

  static Future<MetadataRepository> ensureInitialized(Drift db) async {
    if (_instance == null) {
      final instance = MetadataRepository._(db);
      await instance._hydrate();
      _instance = instance;
    }
    return _instance!;
  }

  static Future<void> refresh() async {
    instance._cache.clear();
    instance._appConfig = const .new();
    instance._systemConfig = const .new();
    await instance._hydrate();
  }

  Future<void> _hydrate() async => _hydrateCache(await _db.select(_db.metadataEntity).get());

  T _read<T extends Object>(MetadataKey<T> key) => (_cache[key] as T?) ?? key.defaultValue;

  Future<void> write<T extends Object>(MetadataKey<T> key, T value) async {
    if (_read(key) == value) return;

    await _db
        .into(_db.metadataEntity)
        .insertOnConflictUpdate(
          MetadataEntityCompanion.insert(key: key.key, value: key.encode(value), updatedAt: Value(DateTime.now())),
        );
    _updateCache(key, value);
  }

  Future<void> delete<T extends Object>(MetadataKey<T> key) async {
    await (_db.delete(_db.metadataEntity)..where((t) => t.key.equals(key.key))).go();
    _updateCache(key, key.defaultValue);
  }

  Stream<AppConfig> watchAppConfig() => _watchDomain(MetadataDomain.appConfig).distinct();

  Stream<SystemConfig> watchSystemConfig() => _watchDomain(MetadataDomain.systemConfig).distinct();

  Stream<T> _watchDomain<T extends Object>(MetadataDomain<T> domain) {
    final query = _db.select(_db.metadataEntity)..where((t) => t.key.like('${domain.prefix}.%'));
    return query.watch().map((rows) {
      _hydrateCache(rows);
      return domain.config(this);
    });
  }

  void _hydrateCache(List<MetadataEntityData> rows) {
    final keyMap = MetadataKey.asKeyMap();
    for (final row in rows) {
      final key = keyMap[row.key];
      if (key == null) continue;
      _updateCache(key, key.decode(row.value));
    }
  }

  void _updateCache<T extends Object>(MetadataKey<T> key, T value) {
    if (_cache[key] == value) return;
    _cache[key] = value;
    key.domain.rebuild(this);
  }
}

extension<T extends Object> on MetadataDomain<T> {
  T config(MetadataRepository repo) => switch (this) {
    .appConfig => repo._appConfig as T,
    .systemConfig => repo._systemConfig as T,
  };

  void rebuild(MetadataRepository repo) {
    switch (this) {
      case .appConfig:
        repo._appConfig = .new(theme: .new(mode: repo._read(.themeMode)));
      case .systemConfig:
        repo._systemConfig = .new(logLevel: repo._read(.logLevel));
    }
  }
}
