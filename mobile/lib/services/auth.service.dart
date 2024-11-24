import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

final authServiceProvider = Provider(
  (ref) => AuthService(
    ref.watch(authApiRepositoryProvider),
    ref.watch(apiServiceProvider),
  ),
);

class AuthService {
  final IAuthApiRepository _authApiRepository;
  final ApiService _apiService;

  AuthService(this._authApiRepository, this._apiService);

  Future<String> validateServerUrl(String endpoint) async {
    final validUrl = await _apiService.resolveAndSetEndpoint(endpoint);
    await _apiService.setDeviceInfoHeader();
    Store.put(StoreKey.serverUrl, validUrl);

    return validUrl;
  }

  Future<LoginResponseDto> login(String email, String password) {
    return _authApiRepository.login(email, password);
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
