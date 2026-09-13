import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/tag/tag.drift.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/infrastructure/repositories/tag.repository.drift.dart';

@DriftAccessor()
class TagRepository extends DatabaseAccessor<Drift> with $TagRepositoryMixin {
  TagRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<List<Tag>> getAll() {
    final query = _db.select(_db.tagEntity)..orderBy([(row) => OrderingTerm.asc(row.value)]);
    return query.map((row) => row.toDto()).get();
  }

  Stream<List<Tag>> watchAll() {
    final query = _db.select(_db.tagEntity)..orderBy([(row) => OrderingTerm.asc(row.value)]);
    return query.map((row) => row.toDto()).watch();
  }

  Future<List<Tag>> getForAsset(String assetId) {
    final query = _db.select(_db.tagEntity).join([
      innerJoin(_db.tagAssetEntity, _db.tagAssetEntity.tagId.equalsExp(_db.tagEntity.id), useColumns: false),
    ]);
    query.where(_db.tagAssetEntity.assetId.equals(assetId));
    query.orderBy([OrderingTerm.asc(_db.tagEntity.value)]);

    return query.map((row) => row.readTable(_db.tagEntity).toDto()).get();
  }
}

extension on TagEntityData {
  Tag toDto() => Tag(id: id, value: value, color: color);
}
