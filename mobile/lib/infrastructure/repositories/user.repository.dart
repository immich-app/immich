import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart' as entity;
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';

class IsarUserRepository extends IsarDatabaseRepository {
  final Isar _db;
  const IsarUserRepository(super.db) : _db = db;

  Future<void> delete(List<String> ids) async {
    await transaction(() async {
      await _db.isarUsers.deleteAllById(ids);
    });
  }

  Future<void> deleteAll() async {
    await transaction(() async {
      await _db.isarUsers.clear();
    });
  }

  Future<List<UserDto>> getAll({SortUserBy? sortBy}) async {
    return (await _db.isarUsers
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

  Future<UserDto?> getByUserId(String id) async {
    return (await _db.isarUsers.getById(id))?.toDto();
  }

  Future<List<UserDto?>> getByUserIds(List<String> ids) async {
    return (await _db.isarUsers.getAllById(ids)).map((u) => u?.toDto()).toList();
  }

  Future<bool> insert(UserDto user) async {
    await transaction(() async {
      await _db.isarUsers.put(entity.IsarUser.fromDto(user));
    });
    return true;
  }

  Future<UserDto> update(UserDto user) async {
    await transaction(() async {
      await _db.isarUsers.put(entity.IsarUser.fromDto(user));
    });
    return user;
  }

  Future<bool> updateAll(List<UserDto> users) async {
    await transaction(() async {
      await _db.isarUsers.putAll(users.map(entity.IsarUser.fromDto).toList());
    });
    return true;
  }
}

class DriftUserRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftUserRepository(this._db) : super(_db);

  Future<List<User>> getAll() {
    return _db.managers.userEntity.orderBy((row) => row.id.asc()).map((row) => row.toDto()).get();
  }

  Future<User?> getById(String id) {
    return _db.managers.userEntity.filter((row) => row.id.equals(id)).map((row) => row.toDto()).getSingleOrNull();
  }
}
