import 'package:immich_mobile/models/auth/login_response.model.dart';

abstract interface class IAuthApiRepository {
  Future<LoginResponse> login(String email, String password);

  Future<void> logout();

  Future<void> changePassword(String newPassword);
}
