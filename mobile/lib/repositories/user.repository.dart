import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/auth.service.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/domain/auth.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final userRepositoryProvider = Provider(
  (ref) => UserRepository(
    ref.watch(dbProvider),
    authService: ref.watch(authServiceProvider),
  ),
);

class UserRepository extends DatabaseRepository implements IUserRepository {
  final AuthService _authService;

  UserRepository(super.db, {required AuthService authService})
      : _authService = authService;

  @override
  Future<List<User>> getByIds(List<String> ids) async =>
      (await db.users.getAllById(ids)).nonNulls.toList();

  @override
  Future<User?> get(String id) => db.users.getById(id);

  @override
  Future<List<User>> getAll({bool self = true, UserSort? sortBy}) {
    final user = _authService.getUser().toOldUser();
    final baseQuery = db.users.where();
    final int userId = user.isarId;
    final QueryBuilder<User, User, QAfterWhereClause> afterWhere =
        self ? baseQuery.noOp() : baseQuery.isarIdNotEqualTo(userId);
    final QueryBuilder<User, User, QAfterSortBy> query = switch (sortBy) {
      null => afterWhere.noOp(),
      UserSort.id => afterWhere.sortById(),
    };
    return query.findAll();
  }

  @override
  Future<User> update(User user) async {
    await txn(() => db.users.put(user));
    return user;
  }

  @override
  Future<User> me() => Future.value(_authService.getUser().toOldUser());

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
      .isarIdEqualTo(_authService.getUser().toOldUser().isarId)
      .findAll();
}
