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
  Future<UserDto?> get(int id) async {
    return (await _db.users.get(id))?.toDto();
  }

  @override
  Future<List<UserDto>> getAll({SortUserBy? sortBy}) async {
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
  Future<UserDto?> getByUserId(String id) async {
    return (await _db.users.getById(id))?.toDto();
  }

  @override
  Future<List<UserDto?>> getByUserIds(List<String> ids) async {
    return (await _db.users.getAllById(ids)).map((u) => u?.toDto()).toList();
  }

  @override
  Future<bool> insert(UserDto user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return true;
  }

  @override
  Future<UserDto> update(UserDto user) async {
    await transaction(() async {
      await _db.users.put(entity.User.fromDto(user));
    });
    return user;
  }

  @override
  Future<bool> updateAll(List<UserDto> users) async {
    await transaction(() async {
      await _db.users.putAll(users.map(entity.User.fromDto).toList());
    });
    return true;
  }
}
