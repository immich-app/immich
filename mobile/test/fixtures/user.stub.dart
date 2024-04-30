import 'package:immich_mobile/entities/user.entity.dart';

final class UserStub {
  const UserStub._();

  static final admin = User(
    id: "admin",
    updatedAt: DateTime(2021),
    email: "admin@test.com",
    name: "admin",
    avatarColor: AvatarColorEnum.green,
    profileImagePath: '',
    isAdmin: true,
  );

  static final user1 = User(
    id: "user1",
    updatedAt: DateTime(2022),
    email: "user1@test.com",
    name: "user1",
    avatarColor: AvatarColorEnum.red,
    profileImagePath: '',
    isAdmin: false,
  );

  static final user2 = User(
    id: "user2",
    updatedAt: DateTime(2023),
    email: "user2@test.com",
    name: "user2",
    avatarColor: AvatarColorEnum.primary,
    profileImagePath: '',
    isAdmin: false,
  );
}
