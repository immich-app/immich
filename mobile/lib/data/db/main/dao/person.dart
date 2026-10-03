import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/dao/person.drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/people/person.drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';

@DriftAccessor()
class PeopleDatabaseRepository extends DatabaseAccessor<Drift> with $PeopleDatabaseRepositoryMixin {
  PeopleDatabaseRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  /// The person for the given [personId], if any
  Stream<Person?> watchPerson(String personId) {
    final query = _db.select(_db.personEntity)..where((row) => row.id.equals(personId));

    return query.map((row) => row.toDto()).watchSingleOrNull();
  }

  /// The people associated with a given [assetId]
  Stream<List<Person>> watchPeopleForAsset(String assetId) {
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

    return query.map((row) => row.toDto()).watch();
  }

  /// All known people with a known associated face and asset
  ///
  /// If [minFaces] is provided (defaults to 3), restrict to people having at least that many unique face entries
  Stream<List<Person>> watchAll({int minFaces = 3}) {
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
    }).watch();
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
  Person toDto() => Person(id: id, updatedAt: updatedAt, name: name, birthDate: birthDate);
}
