import 'package:immich_mobile/interfaces/sync.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final syncRepositoryProvider = Provider(
  (ref) => SyncRepository(
    ref.watch(dbProvider),
  ),
);

class SyncRepository extends DatabaseRepository implements ISyncRepository {
  SyncRepository(super.db);
}
