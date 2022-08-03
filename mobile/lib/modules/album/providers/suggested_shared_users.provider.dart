import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/user.service.dart';
import 'package:openapi/api.dart';

final suggestedSharedUsersProvider =
    FutureProvider.autoDispose<List<UserResponseDto>>((ref) async {
  UserService userService = ref.watch(userServiceProvider);

  return await userService.getAllUsersInfo(isAll: false) ?? [];
});
