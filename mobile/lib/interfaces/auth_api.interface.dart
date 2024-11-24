import 'package:openapi/api.dart';

abstract interface class IAuthApiRepository {
  Future<LoginResponseDto> login(String email, String password);

  Future<LogoutResponseDto> logout();

  Future<UserAdminResponseDto> changePassword(String newPassword);
}
