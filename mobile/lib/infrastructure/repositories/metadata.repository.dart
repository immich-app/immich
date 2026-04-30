import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
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
          MetadataEntityCompanion.insert(key: key.key, value: encode(value), updatedAt: Value(DateTime.now())),
        );
    _updateCache(key, value);
  }

  @visibleForTesting
  static String encode<T extends Object>(T value) => switch (value) {
    Enum() => value.name,
    DateTime() => value.toIso8601String(),
    _ => throw ArgumentError('Unsupported metadata value type: ${value.runtimeType}'),
  };

  @visibleForTesting
  static T decode<T extends Object>(MetadataKey<T> key, String raw) {
    final enumValues = key.enumValues;
    if (enumValues != null) {
      return enumValues.firstWhereOrNull((v) => (v as Enum).name == raw) ?? key.defaultValue;
    }
    return switch (key.defaultValue) {
      DateTime() => (DateTime.tryParse(raw) ?? key.defaultValue) as T,
      _ => throw ArgumentError('Unsupported metadata value type: ${key.defaultValue.runtimeType}'),
    };
  }

  Future<void> delete<T extends Object>(MetadataKey<T> key) async {
    await (_db.delete(_db.metadataEntity)..where((t) => t.key.equals(key.key))).go();
    _updateCache(key, key.defaultValue);
  }

  Stream<AppConfig> watchAppConfig() => _watchDomain(.appConfig).map((_) => appConfig).distinct();

  Stream<SystemConfig> watchSystemConfig() => _watchDomain(.systemConfig).map((_) => systemConfig).distinct();

  Stream<void> _watchDomain(MetadataDomain domain) {
    final query = _db.select(_db.metadataEntity)..where((t) => t.key.like('${domain.prefix}.%'));
    return query.watch().map(_hydrateCache);
  }

  void _hydrateCache(List<MetadataEntityData> rows) {
    final keyMap = MetadataKey.asKeyMap();
    for (final row in rows) {
      final key = keyMap[row.key];
      if (key == null) continue;
      _updateCache(key, decode(key, row.value));
    }
  }

  void _updateCache<T extends Object>(MetadataKey<T> key, T value) {
    if (_cache[key] == value) return;
    _cache[key] = value;
    switch (key.domain) {
      case .appConfig:
        _appConfig = .new(theme: .new(mode: _read(.themeMode)));
      case .systemConfig:
        _systemConfig = .new(logLevel: _read(.logLevel));
    }
  }
}
