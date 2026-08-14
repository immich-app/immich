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
}
