import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';

abstract interface class IUserRepository implements IDatabaseRepository {
  Future<User?> get(String id);

  Future<List<User>> getByIds(List<String> ids);

  Future<List<User>> getAll({bool self = true, UserSort? sortBy});

  /// Returns all users whose assets can be accessed (self+partners)
  Future<List<User>> getAllAccessible();

  Future<List<User>> upsertAll(List<User> users);

  Future<User> update(User user);

  Future<void> deleteById(List<int> ids);

  Future<User> me();
}

enum UserSort { id }
