import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/auth_api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
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

  final _log = Logger("AuthService");

  AuthService(this._authApiRepository, this._apiService);

  /// Validates the provided server URL by resolving and setting the endpoint.
  /// Also sets the device info header and stores the valid URL.
  ///
  /// [url] - The server URL to be validated.
  ///
  /// Returns the validated and resolved server URL as a [String].
  ///
  /// Throws an exception if the URL cannot be resolved or set.
  Future<String> validateServerUrl(String url) async {
    final validUrl = await _apiService.resolveAndSetEndpoint(url);
    await _apiService.setDeviceInfoHeader();
    Store.put(StoreKey.serverUrl, validUrl);

    return validUrl;
  }

  Future<LoginResponseDto> login(String email, String password) {
    return _authApiRepository.login(email, password);
  }

  Future<void> logout() async {
    try {
      await _authApiRepository.logout();
    } catch (error, stackTrace) {
      _log.severe("Error logging out", error, stackTrace);
    }
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) {
    return Future.delayed(Duration(seconds: 1));
  }
}
