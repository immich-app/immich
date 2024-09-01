import 'dart:async';

import 'package:immich_mobile/domain/models/user.model.dart';

abstract class IUserRepository {
  /// Fetches user
  FutureOr<User?> fetch(String userId);

  /// Insert user
  FutureOr<bool> add(User user);
}
