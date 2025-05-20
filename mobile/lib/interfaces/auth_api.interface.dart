import 'package:immich_mobile/models/auth/login_response.model.dart';

abstract interface class IAuthApiRepository {
  Future<LoginResponse> login(String email, String password);

  Future<void> logout();

  Future<void> changePassword(String newPassword);

  Future<bool> unlockPinCode(String pinCode);
  Future<void> lockPinCode();

  Future<void> setupPinCode(String pinCode);
}
