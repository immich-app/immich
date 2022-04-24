import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/user_info.model.dart';
import 'package:immich_mobile/shared/services/user.service.dart';

final suggestedSharedUsersProvider = FutureProvider.autoDispose<List<UserInfo>>((ref) async {
  UserService userService = UserService();

  return await userService.getAllUsersInfo();
});
