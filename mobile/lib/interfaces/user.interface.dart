import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IUserRepository {
  Future<List<User>> getByIds(List<String> ids);
  Future<User?> get(String id);
}
