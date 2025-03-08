import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart'
    as entity;
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';

class IsarUserRepository extends IsarDatabaseRepository
    implements IUserRepository {
  final Isar _db;
  const IsarUserRepository(super.db) : _db = db;

  @override
  Future<void> delete(List<int> ids) async {
    await transaction(() async {
      await _db.users.deleteAll(ids);
    });
  }

  @override
  Future<void> deleteAll() async {
    await transaction(() async {
      await _db.users.clear();
    });
  }

  @override
  Future<User?> get(int id) async {
    return (await _db.users.get(id))?.toDto();
  }

  @override
  Future<List<User>> getAll({SortUserBy? sortBy}) async {
    return (await _db.users
            .where()
            .optional(
              sortBy != null,
              (query) => switch (sortBy!) {
                SortUserBy.id => query.sortById(),
              },
            )
            .findAll())
        .map((u) => u.toDto())
        .toList();
  }

  @override
  Future<User?> getByUserId(String id) async {
    return (await _db.users.getById(id))?.toDto();
  }

  @override
  Future<List<User?>> getByUserIds(List<String> ids) async {
    return (await _db.users.getAllById(ids)).map((u) => u?.toDto()).toList();
  }

  @override
  Future<bool> insert(User user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return true;
  }

  @override
  Future<User> update(User user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return user;
  }

  @override
  Future<bool> updateAll(List<User> users) async {
    await transaction(() async {
      await _db.users.putAll(users.map(entity.User.fromDto).toList());
    });
    return true;
  }
}
