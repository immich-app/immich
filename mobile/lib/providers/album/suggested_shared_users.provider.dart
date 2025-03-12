import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final otherUsersProvider =
    FutureProvider.autoDispose<List<UserDto>>((ref) async {
  UserService userService = ref.watch(userServiceProvider);
  final currentUser = ref.watch(currentUserProvider);

  final allUsers = await userService.getAll();
  allUsers.removeWhere((u) => currentUser?.id == u.id);
  return allUsers;
});
