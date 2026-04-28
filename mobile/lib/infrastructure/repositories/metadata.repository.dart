import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/log_config.dart';
import 'package:immich_mobile/domain/models/config/system_config.dart';
import 'package:immich_mobile/domain/models/config/theme_config.dart';
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
    await instance._hydrate();
  }

  Future<void> _hydrate() async {
    final rows = await _db.select(_db.metadataEntity).get();
    for (final row in rows) {
      final key = MetadataKey.fromKey(row.key);
      if (key != null) _cache[key] = _decode(key, row.value);
    }
  }

  T _read<T extends Object>(MetadataKey<T> key) => (_cache[key] as T?) ?? key.defaultValue;

  Future<void> write<T extends Object>(MetadataKey<T> key, T value) async {
    if (_read(key) == value) return;

    await _db
        .into(_db.metadataEntity)
        .insertOnConflictUpdate(
          MetadataEntityCompanion.insert(key: key.key, value: _encode(value), updatedAt: Value(DateTime.now())),
        );
    _cache[key] = value;
  }

  String _encode<T extends Object>(T value) => switch (value) {
    Enum() => value.name,
    DateTime() => value.toIso8601String(),
    _ => throw ArgumentError('Unsupported metadata value type: ${value.runtimeType}'),
  };

  T _decode<T extends Object>(MetadataKey<T> key, String raw) {
    final enumValues = key.enumValues;
    if (enumValues != null) {
      return enumValues.where((v) => (v as Enum).name == raw).firstOrNull ?? key.defaultValue;
    }
    return switch (key.defaultValue) {
      DateTime() => (DateTime.tryParse(raw) ?? key.defaultValue) as T,
      _ => throw ArgumentError('Unsupported metadata value type: ${key.defaultValue.runtimeType}'),
    };
  }

  Future<void> delete<T extends Object>(MetadataKey<T> key) async {
    _cache[key] = key.defaultValue;
    await (_db.delete(_db.metadataEntity)..where((t) => t.key.equals(key.key))).go();
  }

  Future<void> clearDomain(MetadataDomain domain) async {
    for (final k in MetadataKey.values.where((k) => k.domain == domain)) {
      _cache[k] = k.defaultValue;
    }

    await (_db.delete(_db.metadataEntity)..where((t) => t.key.like('${domain.prefix}.%'))).go();
  }

  AppConfig get appConfig => AppConfig(theme: ThemeConfig(mode: _read(MetadataKey.themeMode)));

  SystemConfig get systemConfig => SystemConfig(log: LogConfig(level: _read(MetadataKey.logLevel)));

  Stream<AppConfig> watchAppConfig() => _watchDomain(MetadataDomain.appConfig).map((_) => appConfig).distinct();

  Stream<SystemConfig> watchSystemConfig() =>
      _watchDomain(MetadataDomain.systemConfig).map((_) => systemConfig).distinct();

  Stream<void> _watchDomain(MetadataDomain domain) {
    final query = _db.select(_db.metadataEntity)..where((t) => t.key.like('${domain.prefix}.%'));
    return query.watch().map((rows) => rows.forEach(_updateCacheForRow));
  }

  void _updateCacheForRow(MetadataEntityData row) {
    final key = MetadataKey.fromKey(row.key);
    if (key == null) return;
    _cache[key] = _decode(key, row.value);
  }
}
