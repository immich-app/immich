import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/auth_api.interface.dart';
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
  Future<UserAdminResponseDto> changePassword(String newPassword) {
    return checkNull(
      _apiService.usersApi.updateMyUser(
        UserUpdateMeDto(
          password: newPassword,
        ),
      ),
    );
  }

  @override
  Future<LoginResponseDto> login(String email, String password) {
    return checkNull(
      _apiService.authenticationApi.login(
        LoginCredentialDto(
          email: email,
          password: password,
        ),
      ),
    );
  }

  @override
  Future<LogoutResponseDto> logout() async {
    return checkNull(
      _apiService.authenticationApi.logout().timeout(
            Duration(seconds: 7),
          ),
    );
  }
}
