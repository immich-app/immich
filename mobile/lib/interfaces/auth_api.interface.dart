import 'package:openapi/api.dart';

abstract interface class IAuthApiRepository {
  Future<LoginResponseDto> login(String email, String password);

  Future<void> logout();

  Future<void> changePassword(String oldPassword, String newPassword);
}
