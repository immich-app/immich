import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/pin.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

final authApiRepositoryProvider = Provider((ref) => AuthApiRepository(ref.watch(apiServiceProvider)));

class AuthApiRepository extends ApiRepository {
  final ApiService _apiService;

  AuthApiRepository(this._apiService);

  Future<void> changePassword({required String currentPassword, required String newPassword}) async {
    await _apiService.authenticationApi.changePassword(
      ChangePasswordDto(password: currentPassword, newPassword: newPassword),
    );
  }

  Future<LoginResponse> login(String email, String password) async {
    final loginResponseDto = await checkNull(
      _apiService.authenticationApi.login(LoginCredentialDto(email: email, password: password)),
    );

    return LoginResponse.fromDto(loginResponseDto);
  }

  Future<void> logout() async {
    if (_apiService.apiClient.basePath.isEmpty) {
      return;
    }

    await _apiService.authenticationApi.logout().timeout(const Duration(seconds: 7));
  }

  Future<bool> unlockPinCode(String pinCode) => PinApiRepository(_apiService.authenticationApi).unlockPinCode(pinCode);

  Future<void> setupPinCode(String pinCode) {
    return _apiService.authenticationApi.setupPinCode(PinCodeSetupDto(pinCode: pinCode));
  }

  Future<void> lockPinCode() => PinApiRepository(_apiService.authenticationApi).lockPinCode();
}
