import 'package:hooks_riverpod/hooks_riverpod.dart';
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
}
