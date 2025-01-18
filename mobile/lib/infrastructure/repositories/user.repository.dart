import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/user.entity.dart' as entity;
import 'package:immich_mobile/infrastructure/repositories/database.repository.dart';
import 'package:isar/isar.dart';

class IsarUserRepository extends IsarDatabaseRepository
    implements IUserRepository {
  final Isar _db;

  const IsarUserRepository(super.db) : _db = db;

  @override
  Future<User?> tryGet(String id) async {
    return (await _db.users.where().idEqualTo(id).findFirst())?.toDomain();
  }

  @override
  Future<User?> update(User user) {
    return nestTxn(() async {
      await _db.users.put(user.toOldUser());
      return user;
    });
  }
}
