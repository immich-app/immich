import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/services/user.service.dart';

final otherUsersProvider = FutureProvider.autoDispose<List<User>>((ref) {
  UserService userService = ref.watch(userServiceProvider);

  return userService.getUsersInDb();
});
