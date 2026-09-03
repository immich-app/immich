import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/remote/stack.drift.dart';
import 'package:immich_mobile/domain/models/stack.model.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.drift.dart';

@DriftAccessor()
class StackRepository extends DatabaseAccessor<Drift> with $StackRepositoryMixin {
  StackRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<List<Stack>> getAll(String userId) {
    final query = _db.stackEntity.select()..where((e) => e.ownerId.equals(userId));

    return query.map((stack) {
      return stack.toDto();
    }).get();
  }
}

extension on StackEntityData {
  Stack toDto() {
    return Stack(id: id, createdAt: createdAt, updatedAt: updatedAt, ownerId: ownerId, primaryAssetId: primaryAssetId);
  }
}
