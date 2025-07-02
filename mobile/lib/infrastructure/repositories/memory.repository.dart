import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftMemoryRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftMemoryRepository(this._db) : super(_db);

  Future<List<Memory>> getAll(String userId) {
    final query = _db.memoryEntity.select()
      ..where((e) => e.ownerId.equals(userId));

    return query.map((memory) {
      return memory.toDto();
    }).get();
  }
}

extension on MemoryEntityData {
  Memory toDto() {
    return Memory(
      id: id,
      createdAt: createdAt,
      updatedAt: updatedAt,
      deletedAt: deletedAt,
      ownerId: ownerId,
      type: type,
      data: MemoryData.fromJson(data),
      isSaved: isSaved,
      memoryAt: memoryAt,
      seenAt: seenAt,
      showAt: showAt,
      hideAt: hideAt,
    );
  }
}
