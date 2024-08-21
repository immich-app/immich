import 'dart:async';

import 'package:immich_mobile/domain/models/user.model.dart';

abstract class IUserRepository {
  /// Fetches user
  FutureOr<User?> getUser(String userId);

  /// Insert user
  FutureOr<bool> insertUser(User user);
}
