import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

class CurrentUserProvider extends ValueNotifier<User> {
  CurrentUserProvider(super.initialState);

  void updateUser(User user) => value = user;
}
