import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/services/user.service.dart';

final suggestedSharedUsersProvider =
    FutureProvider.autoDispose<List<User>>((ref) {
  UserService userService = ref.watch(userServiceProvider);

  return userService.getUsersInDb();
});
