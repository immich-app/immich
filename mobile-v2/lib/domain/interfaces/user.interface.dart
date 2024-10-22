import 'dart:async';

import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserRepository {
  /// Insert user
  Future<bool> upsert(User user);

  /// Fetches user
  Future<User?> getForId(String userId);

  /// Removes all users
  Future<void> deleteAll();
}
