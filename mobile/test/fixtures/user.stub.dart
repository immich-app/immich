import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/user.entity.dart' as entity;

abstract final class UserStub {
  const UserStub._();

  static final adminOld = entity.User(
    id: "admin",
    updatedAt: DateTime(2021),
    email: "admin@test.com",
    name: "admin",
    avatarColor: entity.AvatarColorEnum.green,
    profileImagePath: '',
    isAdmin: true,
  );

  static final user1 = entity.User(
    id: "user1",
    updatedAt: DateTime(2022),
    email: "user1@test.com",
    name: "user1",
    avatarColor: entity.AvatarColorEnum.red,
    profileImagePath: '',
    isAdmin: false,
  );

  static final user2 = entity.User(
    id: "user2",
    updatedAt: DateTime(2023),
    email: "user2@test.com",
    name: "user2",
    avatarColor: entity.AvatarColorEnum.primary,
    profileImagePath: '',
    isAdmin: false,
  );

  static final admin = User(
    id: "admin",
    name: "admin",
    email: "admin@immich.org",
    isAdmin: true,
    updatedAt: DateTime(2021),
    avatarColor: UserAvatarColor.green,
    profileImagePath: '',
  );
}
