import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserRepository implements IDatabaseRepository {
  Future<bool> insert(UserDto user);

  Future<UserDto?> get(int id);

  Future<UserDto?> getByUserId(String id);

  Future<List<UserDto?>> getByUserIds(List<String> ids);

  Future<List<UserDto>> getAll({SortUserBy? sortBy});

  Future<bool> updateAll(List<UserDto> users);

  Future<UserDto> update(UserDto user);

  Future<void> delete(List<int> ids);

  Future<void> deleteAll();
}

enum SortUserBy { id }
