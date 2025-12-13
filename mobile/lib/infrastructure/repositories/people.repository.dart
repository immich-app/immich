import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftPeopleRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftPeopleRepository(this._db) : super(_db);

  Future<List<DriftPerson>> getAssetPeople(String assetId) async {
    final query = _db.select(_db.assetFaceEntity).join([
      innerJoin(_db.personEntity, _db.personEntity.id.equalsExp(_db.assetFaceEntity.personId)),
    ])..where(_db.assetFaceEntity.assetId.equals(assetId) & _db.personEntity.isHidden.equals(false));

    return query.map((row) {
      final person = row.readTable(_db.personEntity);
      return person.toDto();
    }).get();
  }

  Future<List<DriftPerson>> getAllPeople() async {
    final query =
        _db.select(_db.personEntity).join([
            leftOuterJoin(_db.assetFaceEntity, _db.assetFaceEntity.personId.equalsExp(_db.personEntity.id)),
          ])
          ..where(_db.personEntity.isHidden.equals(false))
          ..groupBy([_db.personEntity.id], having: _db.assetFaceEntity.id.count().isBiggerOrEqualValue(3))
          ..orderBy([
            OrderingTerm(expression: _db.personEntity.name.equals('').not(), mode: OrderingMode.desc),
            OrderingTerm(expression: _db.assetFaceEntity.id.count(), mode: OrderingMode.desc),
          ]);

    return query.map((row) {
      final person = row.readTable(_db.personEntity);
      return person.toDto();
    }).get();
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
