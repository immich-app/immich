import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';

final authenticationServiceProvider = Provider(
  (ref) => AuthService(
    ref.watch(authApiRepositoryProvider),
    ref.watch(apiServiceProvider),
  ),
);

class AuthService {
  final IAuthApiRepository _authApiRepository;
  final ApiService _apiService;

  AuthService(this._authApiRepository, this._apiService);

  Future<void> setServerEndpoint(String endpoint) async {
    await _apiService.resolveAndSetEndpoint(endpoint);
  }

  Future<void> login(String email, String password) {
    return Future.delayed(Duration(seconds: 1));
  }

  Future<void> logout() {
    return Future.delayed(Duration(seconds: 1));
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) {
    return Future.delayed(Duration(seconds: 1));
  }
}
