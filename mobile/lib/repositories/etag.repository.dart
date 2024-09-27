import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/interfaces/etag.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final etagRepositoryProvider =
    Provider((ref) => ETagRepository(ref.watch(dbProvider)));

class ETagRepository extends DatabaseRepository implements IETagRepository {
  ETagRepository(super.db);

  @override
  Future<List<String>> getAllIds() => db.eTags.where().idProperty().findAll();

  @override
  Future<ETag?> get(int id) => db.eTags.get(id);

  @override
  Future<void> upsertAll(List<ETag> etags) => txn(() => db.eTags.putAll(etags));

  @override
  Future<void> deleteByIds(List<String> ids) =>
      txn(() => db.eTags.deleteAllById(ids));

  @override
  Future<ETag?> getById(String id) => db.eTags.getById(id);
}
