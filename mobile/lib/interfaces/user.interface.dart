import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IUserRepository {
  Future<User?> get(String id);

  Future<List<User>> getByIds(List<String> ids);

  Future<List<User>> getAll({bool self = true, UserSort? sort});

  /// Returns all users whose assets can be accessed (self+partners)
  Future<List<User>> getAllAccessible();

  Future<List<User>> upsertAll(List<User> users);

  Future<User> update(User user);

  Future<void> deleteById(List<int> ids);

  Future<User> me();
}

enum UserSort { id }
