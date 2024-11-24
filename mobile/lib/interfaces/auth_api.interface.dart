abstract interface class IAuthApiRepository {
  Future<void> login(String email, String password);

  Future<void> logout();

  Future<void> changePassword(String oldPassword, String newPassword);
}
