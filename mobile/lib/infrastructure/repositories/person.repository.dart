import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftPeopleRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftPeopleRepository(this._db) : super(_db);

  Future<List<DriftPeople>> getAssetPeople(String assetId) async {
    final query = _db.select(_db.assetFaceEntity).join([
      innerJoin(
        _db.personEntity,
        _db.personEntity.id.equalsExp(_db.assetFaceEntity.personId),
      ),
    ])
      ..where(
        _db.assetFaceEntity.assetId.equals(assetId) & _db.personEntity.isHidden.equals(false),
      );

    return query.map((row) {
      final person = row.readTable(_db.personEntity);
      return person.toDto();
    }).get();
  }
}

extension on PersonEntityData {
  DriftPeople toDto() {
    return DriftPeople(
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
