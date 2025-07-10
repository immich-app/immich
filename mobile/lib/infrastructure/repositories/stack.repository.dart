import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftStackRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftStackRepository(this._db) : super(_db);

  Future<List<Stack>> getAll(String userId) {
    final query = _db.stackEntity.select()
      ..where((e) => e.ownerId.equals(userId));

    return query.map((stack) {
      return stack.toDto();
    }).get();
  }
}

extension on StackEntityData {
  Stack toDto() {
    return Stack(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      ownerId: ownerId,
      primaryAssetId: primaryAssetId,
    );
  }
}
