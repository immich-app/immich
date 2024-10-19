import 'package:immich_mobile/domain/interfaces/api/user_api.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart' as model;
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class UserApiRepository with LogMixin implements IUserApiRepository {
  final UsersApi _usersApi;

  const UserApiRepository({required UsersApi usersApi}) : _usersApi = usersApi;

  @override
  Future<model.User?> getMyUser() async {
    try {
      final [
        userDto as UserAdminResponseDto?,
        preferencesDto as UserPreferencesResponseDto?
      ] = await Future.wait([
        _usersApi.getMyUser(),
        _usersApi.getMyPreferences(),
      ]);

      if (userDto == null) {
        log.e("Cannot fetch my user.");
        return null;
      }

      return _fromAdminDto(userDto, preferencesDto);
    } catch (e, s) {
      log.e("Error while fetching my user", e, s);
    }
    return null;
  }
}

model.User _fromAdminDto(
  UserAdminResponseDto userDto, [
  UserPreferencesResponseDto? userPreferences,
]) {
  return model.User(
    id: userDto.id,
    updatedAt: DateTime.now(),
    name: userDto.name,
    email: userDto.email,
    isAdmin: userDto.isAdmin,
    quotaSizeInBytes: userDto.quotaSizeInBytes ?? 0,
    quotaUsageInBytes: userDto.quotaUsageInBytes ?? 0,
    inTimeline: true,
    profileImagePath: userDto.profileImagePath,
    memoryEnabled: userPreferences?.memories.enabled ?? true,
    avatarColor: userDto.avatarColor.toEnum(),
  );
}

extension _AvatarColorEnumHelper on UserAvatarColor {
  model.UserAvatarColor toEnum() {
    switch (this) {
      case UserAvatarColor.primary:
        return model.UserAvatarColor.primary;
      case UserAvatarColor.pink:
        return model.UserAvatarColor.pink;
      case UserAvatarColor.red:
        return model.UserAvatarColor.red;
      case UserAvatarColor.yellow:
        return model.UserAvatarColor.yellow;
      case UserAvatarColor.blue:
        return model.UserAvatarColor.blue;
      case UserAvatarColor.green:
        return model.UserAvatarColor.green;
      case UserAvatarColor.purple:
        return model.UserAvatarColor.purple;
      case UserAvatarColor.orange:
        return model.UserAvatarColor.orange;
      case UserAvatarColor.gray:
        return model.UserAvatarColor.gray;
      case UserAvatarColor.amber:
        return model.UserAvatarColor.amber;
    }
    return model.UserAvatarColor.primary;
  }
}
