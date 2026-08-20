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
    final userId = TestUtils.uuid(id);
    return User(
      id: userId,
      name: name ?? 'user_$userId',
      email: email ?? '$userId@test.com',
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
    final userId = TestUtils.uuid(id);
    return UserDto(
      id: userId,
      name: name ?? 'user_$userId',
      email: email ?? '$userId@test.com',
      profileChangedAt: TestUtils.date(profileChangedAt),
      hasProfileImage: hasProfileImage ?? false,
      avatarColor: avatarColor ?? .primary,
    );
  }
}
