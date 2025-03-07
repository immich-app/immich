import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/sync-stream.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:openapi/api.dart';

class DriftSyncStreamRepository extends DriftDatabaseRepository
    implements ISyncStreamRepository {
  final Drift _db;

  const DriftSyncStreamRepository(super.db) : _db = db;

  @override
  Future<bool> deleteUsersV1(SyncUserDeleteV1 data) async {
    return (await _db.managers.userEntity
            .filter((row) => row.uid.equals(data.userId))
            .delete()) ==
        1;
  }

  @override
  Future<bool> updateUsersV1(SyncUserV1 data) async {
    return (await _db.managers.userEntity
            .filter((row) => row.uid.equals(data.id))
            .update(
              (u) => u(email: Value(data.email), name: Value(data.name)),
            )) ==
        1;
  }
}
