import 'package:immich_data/model/user/user.dart';
import 'package:openapi/api.dart';

abstract final class DtoConverter {
  // TODO(rewrite): This is duplicated from lib/infrastructure/utils/user.converter.dart
  static UserDto toUser(UserResponseDto dto) => UserDto(
    id: dto.id,
    email: dto.email,
    name: dto.name,
    isAdmin: false,
    updatedAt: DateTime.now(),
    hasProfileImage: dto.profileImagePath.isNotEmpty,
    profileChangedAt: dto.profileChangedAt,
    avatarColor: _toAvatarColor(dto.avatarColor),
  );
}

AvatarColor _toAvatarColor(UserAvatarColor color) => switch (color) {
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
