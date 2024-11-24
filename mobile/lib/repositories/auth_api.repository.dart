import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';

final authApiRepositoryProvider = Provider((ref) => AuthApiRepository());

class AuthApiRepository implements IAuthApiRepository {
  @override
  Future<void> changePassword(String oldPassword, String newPassword) {
    // TODO: implement changePassword
    throw UnimplementedError();
  }

  @override
  Future<void> login(String email, String password) {
    // TODO: implement login
    throw UnimplementedError();
  }

  @override
  Future<void> logout() {
    // TODO: implement logout
    throw UnimplementedError();
  }
}
