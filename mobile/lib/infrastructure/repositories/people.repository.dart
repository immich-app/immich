import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftPeopleRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftPeopleRepository(this._db) : super(_db);

  Future<DriftPerson?> get(String personId) async {
    final query = _db.personEntity.select().join([
      innerJoin(_db.personUserEntity, _db.personUserEntity.personId.equalsExp(_db.personEntity.id)),
    ])..where(_db.personEntity.id.equals(personId));

    final result = await query.getSingleOrNull();
    final person = result?.readTable(_db.personEntity);
    final personUser = result?.readTable(_db.personUserEntity);
    if (person == null || personUser == null) {
      return null;
    }

    return mapToPerson(person, personUser);
  }

  Future<List<DriftPerson>> getAssetPeople(String assetId) {
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

    final query = _db.personEntity.select().join([
      innerJoin(_db.personUserEntity, _db.personUserEntity.personId.equalsExp(_db.personEntity.id)),
    ])..where(_db.personEntity.id.isInQuery(faceQuery) & _db.personUserEntity.isHidden.equals(false));

    return query.map((row) => mapToPerson(row.readTable(_db.personEntity), row.readTable(_db.personUserEntity))).get();
  }

  Future<List<DriftPerson>> getAllPeople({int minFaces = 3}) {
    final people = _db.personEntity;
    final personUsers = _db.personUserEntity;
    final faces = _db.assetFaceEntity;
    final assets = _db.remoteAssetEntity;

    final query =
        _db.select(people).join([
            innerJoin(personUsers, personUsers.personId.equalsExp(people.id)),
            innerJoin(faces, faces.personId.equalsExp(people.id)),
            innerJoin(assets, assets.id.equalsExp(faces.assetId)),
          ])
          ..where(
            personUsers.isHidden.equals(false) &
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

    return query.map((row) => mapToPerson(row.readTable(_db.personEntity), row.readTable(_db.personUserEntity))).get();
  }

  Future<int> updateName(String personId, String name) {
    final query = _db.update(_db.personEntity)..where((row) => row.id.equals(personId));

    return query.write(PersonEntityCompanion(name: Value(name), updatedAt: Value(DateTime.now())));
  }

  Future<int> updateBirthday(String personId, DateTime birthday) {
    final query = _db.update(_db.personEntity)..where((row) => row.id.equals(personId));

    return query.write(PersonEntityCompanion(birthDate: Value(birthday), updatedAt: Value(DateTime.now())));
  }
}
