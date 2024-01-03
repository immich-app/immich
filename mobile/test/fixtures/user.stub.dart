import 'package:immich_mobile/shared/models/user.dart';

final class UserStub {
  const UserStub._();

  static final admin = User(
    id: "admin",
    updatedAt: DateTime(2021),
    email: "admin@test.com",
    name: "admin",
    isAdmin: true,
  );

  static final user1 = User(
    id: "user1",
    updatedAt: DateTime(2022),
    email: "user1@test.com",
    name: "user1",
    isAdmin: false,
  );
}
