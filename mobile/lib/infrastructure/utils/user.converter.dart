import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:openapi/api.dart';

abstract final class UserConverter {
  /// Base user dto used where the complete user object is not required
  static UserDto fromSimpleUserDto(UserResponseDto dto) => UserDto(
        uid: dto.id,
        email: dto.email,
        name: dto.name,
        isAdmin: false,
        updatedAt: DateTime.now(),
        profileImagePath: dto.profileImagePath,
        avatarColor: dto.avatarColor.toAvatarColor(),
      );

  static UserDto fromAdminDto(
    UserAdminResponseDto adminDto, [
    UserPreferencesResponseDto? preferenceDto,
  ]) =>
      UserDto(
        uid: adminDto.id,
        email: adminDto.email,
        name: adminDto.name,
        isAdmin: adminDto.isAdmin,
        updatedAt: adminDto.updatedAt,
        profileImagePath: adminDto.profileImagePath,
        avatarColor: adminDto.avatarColor.toAvatarColor(),
        memoryEnabled: preferenceDto?.memories.enabled ?? true,
        inTimeline: false,
        isPartnerSharedBy: false,
        isPartnerSharedWith: false,
        quotaUsageInBytes: adminDto.quotaUsageInBytes ?? 0,
        quotaSizeInBytes: adminDto.quotaSizeInBytes ?? 0,
      );

  static UserDto fromPartnerDto(PartnerResponseDto dto) => UserDto(
        uid: dto.id,
        email: dto.email,
        name: dto.name,
        isAdmin: false,
        updatedAt: DateTime.now(),
        profileImagePath: dto.profileImagePath,
        avatarColor: dto.avatarColor.toAvatarColor(),
        memoryEnabled: false,
        inTimeline: dto.inTimeline ?? false,
        isPartnerSharedBy: false,
        isPartnerSharedWith: false,
        quotaUsageInBytes: 0,
        quotaSizeInBytes: 0,
      );
}

extension on UserAvatarColor {
  AvatarColor toAvatarColor() => switch (this) {
        UserAvatarColor.red => AvatarColor.red,
        UserAvatarColor.green => AvatarColor.green,
        UserAvatarColor.blue => AvatarColor.blue,
        UserAvatarColor.purple => AvatarColor.purple,
        UserAvatarColor.orange => AvatarColor.orange,
        UserAvatarColor.pink => AvatarColor.pink,
        UserAvatarColor.amber => AvatarColor.amber,
        UserAvatarColor.yellow => AvatarColor.yellow,
        UserAvatarColor.gray => AvatarColor.gray,
        UserAvatarColor.primary || _ => AvatarColor.primary,
      };
}
