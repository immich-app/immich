import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserRepository implements IDatabaseRepository {
  Future<bool> insert(User user);

  Future<User?> get(int id);

  Future<User?> getByUserId(String id);

  Future<List<User?>> getByUserIds(List<String> ids);

  Future<List<User>> getAll({SortUserBy? sortBy});

  Future<bool> updateAll(List<User> users);

  Future<User> update(User user);

  Future<void> delete(List<int> ids);

  Future<void> deleteAll();
}

enum SortUserBy { id }
