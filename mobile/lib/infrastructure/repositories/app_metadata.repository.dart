import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/app_metadata_key.dart';
import 'package:immich_mobile/infrastructure/entities/app_metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class AppMetadataRepository {
  final Drift _db;

  const AppMetadataRepository(this._db);

  Future<T> get<T>(AppMetadataKey<T> key) async {
    final row = await (_db.select(_db.appMetadataEntity)..where((row) => row.key.equals(key.name))).getSingleOrNull();
    final value = row?.value;
    return value == null ? key.defaultValue : key.decode(value);
  }

  Future<void> set<T, U extends T>(AppMetadataKey<T> key, U value) async {
    await _db
        .into(_db.appMetadataEntity)
        .insertOnConflictUpdate(
          AppMetadataEntityCompanion.insert(
            key: key.name,
            value: Value(key.encode(value)),
            updatedAt: Value(DateTime.now()),
          ),
        );
  }
}
