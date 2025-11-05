import 'package:immich_mobile/domain/models/user.model.dart';

abstract final class UserStub {
  const UserStub._();

  static final admin = UserDto(
    id: "admin",
    email: "admin@test.com",
    name: "admin",
    isAdmin: true,
    updatedAt: DateTime(2021),
    profileChangedAt: DateTime(2021),
    avatarColor: AvatarColor.green,
  );

  static final user1 = UserDto(
    id: "user1",
    email: "user1@test.com",
    name: "user1",
    isAdmin: false,
    updatedAt: DateTime(2022),
    profileChangedAt: DateTime(2022),
    avatarColor: AvatarColor.red,
  );

  static final user2 = UserDto(
    id: "user2",
    email: "user2@test.com",
    name: "user2",
    isAdmin: false,
    updatedAt: DateTime(2023),
    profileChangedAt: DateTime(2023),
    avatarColor: AvatarColor.primary,
  );
}
