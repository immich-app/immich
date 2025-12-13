import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:openapi/api.dart';

// TODO: Move to repository once all classes are refactored
abstract final class UserConverter {
  /// Base user dto used where the complete user object is not required
  static UserDto fromSimpleUserDto(UserResponseDto dto) => UserDto(
    id: dto.id,
    email: dto.email,
    name: dto.name,
    isAdmin: false,
    updatedAt: DateTime.now(),
    hasProfileImage: dto.profileImagePath.isNotEmpty,
    profileChangedAt: dto.profileChangedAt,
    avatarColor: dto.avatarColor.toAvatarColor(),
  );

  static UserDto fromAdminDto(UserAdminResponseDto adminDto, [UserPreferencesResponseDto? preferenceDto]) => UserDto(
    id: adminDto.id,
    email: adminDto.email,
    name: adminDto.name,
    isAdmin: adminDto.isAdmin,
    updatedAt: adminDto.updatedAt,
    avatarColor: adminDto.avatarColor.toAvatarColor(),
    memoryEnabled: preferenceDto?.memories.enabled ?? true,
    inTimeline: false,
    isPartnerSharedBy: false,
    isPartnerSharedWith: false,
    profileChangedAt: adminDto.profileChangedAt,
    hasProfileImage: adminDto.profileImagePath.isNotEmpty,
    quotaSizeInBytes: adminDto.quotaSizeInBytes ?? 0,
    quotaUsageInBytes: adminDto.quotaUsageInBytes ?? 0,
  );

  static UserDto fromPartnerDto(PartnerResponseDto dto) => UserDto(
    id: dto.id,
    email: dto.email,
    name: dto.name,
    isAdmin: false,
    updatedAt: DateTime.now(),
    avatarColor: dto.avatarColor.toAvatarColor(),
    memoryEnabled: false,
    inTimeline: dto.inTimeline ?? false,
    isPartnerSharedBy: false,
    isPartnerSharedWith: false,
    profileChangedAt: dto.profileChangedAt,
    hasProfileImage: dto.profileImagePath.isNotEmpty,
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
