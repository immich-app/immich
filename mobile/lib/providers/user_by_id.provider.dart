import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:immich_mobile/providers/api.provider.dart';

final userByIdProvider = FutureProvider.family<UserDto?, String>((ref, userId) async {
  final apiService = ref.watch(apiServiceProvider);
  final user = await apiService.usersApi.getUser(userId);
  if (user == null) {
    return null;
  }
  return UserConverter.fromSimpleUserDto(user);
});
