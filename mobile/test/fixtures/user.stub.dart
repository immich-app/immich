import 'package:immich_mobile/domain/models/user.model.dart';

abstract final class UserStub {
  const UserStub._();

  static final admin = User(
    uid: "admin",
    email: "admin@test.com",
    name: "admin",
    isAdmin: true,
    updatedAt: DateTime(2021),
    profileImagePath: null,
    avatarColor: AvatarColor.primary,
  );

  static final user1 = User(
    uid: "user1",
    email: "user1@test.com",
    name: "user1",
    isAdmin: false,
    updatedAt: DateTime(2022),
    profileImagePath: null,
    avatarColor: AvatarColor.primary,
  );

  static final user2 = User(
    uid: "user2",
    email: "user2@test.com",
    name: "user2",
    isAdmin: false,
    updatedAt: DateTime(2023),
    profileImagePath: null,
    avatarColor: AvatarColor.primary,
  );
}
