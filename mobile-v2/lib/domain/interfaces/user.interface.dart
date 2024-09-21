import 'dart:async';

import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserRepository {
  /// Insert user
  FutureOr<bool> upsert(User user);

  /// Fetches user
  FutureOr<User?> getForId(String userId);
}
