import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftPeopleRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftPeopleRepository(this._db) : super(_db);

  Future<DriftPerson?> get(String personId) async {
    final query = _db.select(_db.personEntity)..where((row) => row.id.equals(personId));

    final result = await query.getSingleOrNull();
    return result?.toDto();
  }

  Future<List<DriftPerson>> getAssetPeople(String assetId) async {
    // An asset can have multiple face records for the same person (e.g., metadata
    // imports alongside ML detections). Use a subquery instead of a join so each
    // person is returned once, regardless of how many of their faces are on the asset
    final faceQuery = _db.assetFaceEntity.selectOnly()
      ..addColumns([_db.assetFaceEntity.personId])
      ..where(
        _db.assetFaceEntity.assetId.equals(assetId) &
            _db.assetFaceEntity.isVisible.equals(true) &
            _db.assetFaceEntity.deletedAt.isNull(),
      );

    final query = _db.select(_db.personEntity)
      ..where((row) => row.id.isInQuery(faceQuery) & row.isHidden.equals(false));

    return query.map((row) => row.toDto()).get();
  }

  Future<List<DriftPerson>> getAllPeople({int minFaces = 3}) async {
    final people = _db.personEntity;
    final faces = _db.assetFaceEntity;
    final assets = _db.remoteAssetEntity;

    final query =
        _db.select(people).join([
            innerJoin(faces, faces.personId.equalsExp(people.id)),
            innerJoin(assets, assets.id.equalsExp(faces.assetId)),
          ])
          ..where(
            people.isHidden.equals(false) &
                assets.deletedAt.isNull() &
                assets.visibility.equalsValue(AssetVisibility.timeline) &
                faces.isVisible.equals(true) &
                faces.deletedAt.isNull(),
          )
          ..groupBy([people.id], having: faces.id.count().isBiggerOrEqualValue(minFaces) | people.name.equals('').not())
          ..orderBy([
            OrderingTerm(expression: people.name.equals('').not(), mode: OrderingMode.desc),
            OrderingTerm(expression: faces.id.count(), mode: OrderingMode.desc),
          ]);

    return query.map((row) {
      final person = row.readTable(people);
      return person.toDto();
    }).get();
  }

  Stream<DriftPerson?> watchPersonById(String personId) {
    return (_db.select(
      _db.personEntity,
    )..where((tbl) => tbl.id.equals(personId))).watchSingleOrNull().map((entity) => entity?.toDto());
  }

  Future<int> updateName(String personId, String name) {
    final query = _db.update(_db.personEntity)..where((row) => row.id.equals(personId));

    return query.write(PersonEntityCompanion(name: Value(name), updatedAt: Value(DateTime.now())));
  }

  Future<int> updateBirthday(String personId, DateTime birthday) {
    final query = _db.update(_db.personEntity)..where((row) => row.id.equals(personId));

    return query.write(PersonEntityCompanion(birthDate: Value(birthday), updatedAt: Value(DateTime.now())));
  }

  Future<int> mergePeople(String targetPersonId, List<String> mergePersonIds) async {
    return _db.transaction(() async {
      // Update AssetFaceEntity to point to the target person
      final updateQuery = _db.update(_db.assetFaceEntity)..where((row) => row.personId.isIn(mergePersonIds));
      final updatedCount = await updateQuery.write(AssetFaceEntityCompanion(personId: Value(targetPersonId)));

      // Delete merged persons
      final deleteQuery = _db.delete(_db.personEntity)..where((row) => row.id.isIn(mergePersonIds));
      final deletedCount = await deleteQuery.go();

      return updatedCount + deletedCount;
    });
  }
}

extension on PersonEntityData {
  DriftPerson toDto() {
    return DriftPerson(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      ownerId: ownerId,
      name: name,
      faceAssetId: faceAssetId,
      isFavorite: isFavorite,
      isHidden: isHidden,
      color: color,
      birthDate: birthDate,
    );
  }
}
