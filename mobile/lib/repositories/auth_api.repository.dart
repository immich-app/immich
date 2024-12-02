import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

final authApiRepositoryProvider =
    Provider((ref) => AuthApiRepository(ref.watch(apiServiceProvider)));

class AuthApiRepository extends ApiRepository implements IAuthApiRepository {
  final ApiService _apiService;

  AuthApiRepository(this._apiService);

  @override
  Future<void> changePassword(String newPassword) async {
    await _apiService.usersApi.updateMyUser(
      UserUpdateMeDto(
        password: newPassword,
      ),
    );
  }

  @override
  Future<LoginResponse> login(String email, String password) async {
    final loginResponseDto = await checkNull(
      _apiService.authenticationApi.login(
        LoginCredentialDto(
          email: email,
          password: password,
        ),
      ),
    );

    return _mapLoginReponse(loginResponseDto);
  }

  @override
  Future<void> logout() async {
    await _apiService.authenticationApi
        .logout()
        .timeout(const Duration(seconds: 7));
  }

  _mapLoginReponse(LoginResponseDto dto) {
    return LoginResponse(
      accessToken: dto.accessToken,
      isAdmin: dto.isAdmin,
      name: dto.name,
      profileImagePath: dto.profileImagePath,
      shouldChangePassword: dto.shouldChangePassword,
      userEmail: dto.userEmail,
      userId: dto.userId,
    );
  }
}
