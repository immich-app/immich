import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftPersonRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftPersonRepository(this._db) : super(_db);

  Future<List<Person>> getAll(String userId) {
    final query = _db.personEntity.select()..where((e) => e.ownerId.equals(userId));

    return query.map((person) {
      return person.toDto();
    }).get();
  }
}

extension on PersonEntityData {
  Person toDto() {
    return Person(
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
