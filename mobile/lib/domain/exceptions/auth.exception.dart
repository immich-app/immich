class UserNotLoggedInException implements Exception {
  const UserNotLoggedInException();

  @override
  String toString() => "User not logged in / Cannot fetch offline user";
}
