import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final etagRepositoryProvider =
    Provider((ref) => ETagRepository(ref.watch(dbProvider)));

class ETagRepository extends DatabaseRepository {
  ETagRepository(super.db);

  Future<List<String>> getAllIds() => db.eTags.where().idProperty().findAll();

  Future<ETag?> get(String id) => db.eTags.getById(id);

  Future<void> upsertAll(List<ETag> etags) => txn(() => db.eTags.putAll(etags));

  Future<void> deleteByIds(List<String> ids) =>
      txn(() => db.eTags.deleteAllById(ids));

  Future<ETag?> getById(String id) => db.eTags.getById(id);

  Future<void> clearTable() async {
    await txn(() async {
      await db.eTags.clear();
    });
  }
}
