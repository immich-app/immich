import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserRepository {
  Future<User?> tryGet(String id);

  Future<User> update(User user);
}
