import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/tag/asset.drift.dart';
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

  Future<void> upsertTags(List<Tag> tags, String ownerId) {
    return _db.batch((batch) {
      for (final tag in tags) {
        final companion = TagEntityCompanion(
          ownerId: Value(ownerId),
          value: Value(tag.value),
          color: Value(tag.color),
          updatedAt: Value(DateTime.now()),
        );
        batch.insert(_db.tagEntity, companion.copyWith(id: Value(tag.id)), onConflict: DoUpdate((_) => companion));
      }
    });
  }

  Future<void> updateTag(String id, {required String value, String? color}) {
    return (_db.update(_db.tagEntity)..where((row) => row.id.equals(id))).write(
      TagEntityCompanion(value: Value(value), color: Value(color), updatedAt: Value(DateTime.now())),
    );
  }

  Future<void> deleteTag(String id) {
    return (_db.delete(_db.tagEntity)..where((row) => row.id.equals(id))).go();
  }

  Future<void> addTagAssets(List<String> assetIds, List<String> tagIds) {
    return _db.batch((batch) {
      for (final tagId in tagIds) {
        for (final assetId in assetIds) {
          batch.insert(
            _db.tagAssetEntity,
            TagAssetEntityCompanion(tagId: Value(tagId), assetId: Value(assetId)),
            onConflict: DoNothing(),
          );
        }
      }
    });
  }

  Future<void> removeTagAssets(String tagId, List<String> assetIds) {
    return _db.batch((batch) {
      for (final assetId in assetIds) {
        batch.delete(_db.tagAssetEntity, TagAssetEntityCompanion(tagId: Value(tagId), assetId: Value(assetId)));
      }
    });
  }
}

extension on TagEntityData {
  Tag toDto() => Tag(id: id, value: value, color: color);
}
