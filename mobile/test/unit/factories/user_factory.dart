import 'package:immich_mobile/domain/models/user.model.dart';

import '../../utils.dart';

class UserFactory {
  const UserFactory();

  static User create({
    String? id,
    String? name,
    String? email,
    DateTime? profileChangedAt,
    bool? hasProfileImage,
    AvatarColor? avatarColor,
  }) {
    id = TestUtils.uuid(id);
    return User(
      id: id,
      name: name ?? 'user_$id',
      email: email ?? '$id@test.com',
      profileChangedAt: TestUtils.date(profileChangedAt),
      hasProfileImage: hasProfileImage ?? false,
      avatarColor: avatarColor ?? .primary,
    );
  }

  static UserDto createDto({
    String? id,
    String? name,
    String? email,
    DateTime? profileChangedAt,
    bool? hasProfileImage,
    AvatarColor? avatarColor,
  }) {
    id = TestUtils.uuid(id);
    return UserDto(
      id: id,
      name: name ?? 'user_$id',
      email: email ?? '$id@test.com',
      profileChangedAt: TestUtils.date(profileChangedAt),
      hasProfileImage: hasProfileImage ?? false,
      avatarColor: avatarColor ?? .primary,
    );
  }
}
