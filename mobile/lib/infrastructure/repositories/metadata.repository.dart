import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/metadata_kind.dart';
import 'package:immich_mobile/domain/models/metadata_value.dart';
import 'package:immich_mobile/infrastructure/entities/metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class MetadataRepository extends DriftDatabaseRepository {
  final Drift _db;

  const MetadataRepository(this._db) : super(_db);

  Future<T> get<T extends MetadataValue>(MetadataKind<T> kind) async {
    final row = await (_db.select(_db.metadataEntity)..where((t) => t.key.equals(kind.key))).getSingleOrNull();
    return _toValue(kind, row) as T;
  }

  Future<void> set<T extends MetadataValue>(MetadataKind<T> kind, T value) async {
    await _db
        .into(_db.metadataEntity)
        .insertOnConflictUpdate(
          MetadataEntityCompanion.insert(
            key: kind.key,
            value: jsonEncode(value.toJson()),
            updatedAt: Value(DateTime.now()),
          ),
        );
  }

  Future<void> delete<T extends MetadataValue>(MetadataKind<T> kind) async {
    await (_db.delete(_db.metadataEntity)..where((t) => t.key.equals(kind.key))).go();
  }

  Stream<T> watch<T extends MetadataValue>(MetadataKind<T> kind) {
    return (_db.select(
      _db.metadataEntity,
    )..where((t) => t.key.equals(kind.key))).watchSingleOrNull().map((row) => _toValue(kind, row) as T);
  }

  MetadataValue _toValue(MetadataKind kind, MetadataEntityData? row) =>
      row == null ? kind.defaultValue : kind.fromJson(jsonDecode(row.value) as Map<String, Object?>);
}
