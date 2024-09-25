import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final userRepositoryProvider =
    Provider((ref) => UserRepository(ref.watch(dbProvider)));

class UserRepository implements IUserRepository {
  final Isar _db;

  UserRepository(
    this._db,
  );

  @override
  Future<List<User>> getByIds(List<String> ids) async =>
      (await _db.users.getAllById(ids)).cast();

  @override
  Future<User?> get(String id) => _db.users.getById(id);

  @override
  Future<List<User>> getAll({bool self = true}) {
    if (self) {
      return _db.users.where().findAll();
    }
    final int userId = Store.get(StoreKey.currentUser).isarId;
    return _db.users.where().isarIdNotEqualTo(userId).findAll();
  }

  @override
  Future<User> update(User user) async {
    await _db.writeTxn(() => _db.users.put(user));
    return user;
  }
}
