import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final userRepositoryProvider =
    Provider((ref) => UserRepository(ref.watch(dbProvider)));

class UserRepository extends DatabaseRepository implements IUserRepository {
  UserRepository(super.db);

  @override
  Future<List<User>> getByIds(List<String> ids) async =>
      (await db.users.getAllById(ids)).nonNulls.toList();

  @override
  Future<User?> get(String id) => db.users.getById(id);

  @override
  Future<List<User>> getAll({bool self = true, UserSort? sortBy}) {
    final baseQuery = db.users.where();
    final int userId = Store.get(StoreKey.currentUser).isarId;
    final QueryBuilder<User, User, QAfterWhereClause> afterWhere =
        self ? baseQuery.noOp() : baseQuery.isarIdNotEqualTo(userId);
    final QueryBuilder<User, User, QAfterSortBy> query;
    switch (sortBy) {
      case null:
        query = afterWhere.noOp();
      case UserSort.id:
        query = afterWhere.sortById();
    }
    return query.findAll();
  }

  @override
  Future<User> update(User user) async {
    await txn(() => db.users.put(user));
    return user;
  }

  @override
  Future<User> me() => Future.value(Store.get(StoreKey.currentUser));

  @override
  Future<void> deleteById(List<int> ids) => txn(() => db.users.deleteAll(ids));

  @override
  Future<List<User>> upsertAll(List<User> users) async {
    await txn(() => db.users.putAll(users));
    return users;
  }

  @override
  Future<List<User>> getAllAccessible() => db.users
      .filter()
      .isPartnerSharedWithEqualTo(true)
      .or()
      .isarIdEqualTo(Store.get(StoreKey.currentUser).isarId)
      .findAll();
}
