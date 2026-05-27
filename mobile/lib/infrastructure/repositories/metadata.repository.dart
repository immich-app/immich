import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/metadata_key.dart';
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class MetadataRepository extends DriftDatabaseRepository {
  final Drift _db;

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

  static Future<MetadataRepository> ensureInitialized(Drift db) async {
    if (_instance == null) {
      final instance = MetadataRepository._(db);
      await instance.refresh();
      _instance = instance;
    }
    return _instance!;
  }

  Future<void> refresh() async => _applyOverrides(await _db.select(_db.metadataEntity).get());

  Future<void> write<T extends Object, U extends T>(MetadataKey<T> key, U value) async {
    if (value == _appConfig.read(key)) {
      return;
    }

    if (value == defaultConfig.read(key)) {
      await (_db.delete(_db.metadataEntity)..where((t) => t.key.equals(key.name))).go();
    } else {
      await _db
          .into(_db.metadataEntity)
          .insertOnConflictUpdate(
            MetadataEntityCompanion.insert(key: key.name, value: key.encode(value), updatedAt: Value(DateTime.now())),
          );
    }

    _appConfig = _appConfig.write(key, value);
  }

  Stream<AppConfig> watchConfig() => _db.select(_db.metadataEntity).watch().map((rows) {
    _applyOverrides(rows);
    return _appConfig;
  });

  void _applyOverrides(List<MetadataEntityData> rows) {
    _appConfig = AppConfig.fromEntries(
      rows.fold({}, (overrides, row) {
        final metadataKey = MetadataKey.values.firstWhereOrNull((key) => key.name == row.key);
        if (metadataKey == null) {
          return overrides;
        }

        return {...overrides, metadataKey: metadataKey.decode(row.value)};
      }),
    );
  }
}
