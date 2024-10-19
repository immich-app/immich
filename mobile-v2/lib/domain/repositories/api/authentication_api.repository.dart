import 'package:immich_mobile/domain/interfaces/api/authentication_api.interface.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class AuthenticationApiRepository
    with LogMixin
    implements IAuthenticationApiRepository {
  final AuthenticationApi _authenticationApi;
  final OAuthApi _oAuthApi;

  const AuthenticationApiRepository({
    required AuthenticationApi authenticationApi,
    required OAuthApi oAuthApi,
  })  : _authenticationApi = authenticationApi,
        _oAuthApi = oAuthApi;

  @override
  Future<String?> login(String email, String password) async {
    try {
      final response = await _authenticationApi
          .login(LoginCredentialDto(email: email, password: password));
      return response?.accessToken;
    } catch (e, s) {
      log.e("Exception occured while performing password login", e, s);
    }
    return null;
  }

  @override
  Future<String?> startOAuth({required String redirectUri}) async {
    try {
      final response =
          await _oAuthApi.startOAuth(OAuthConfigDto(redirectUri: redirectUri));
      return response?.url;
    } catch (e, s) {
      log.e("Exception occured while starting oauth login", e, s);
    }
    return null;
  }

  @override
  Future<String?> finishOAuth(String url) async {
    try {
      final response = await _oAuthApi.finishOAuth(OAuthCallbackDto(url: url));
      return response?.accessToken;
    } catch (e, s) {
      log.e("Exception occured while finishing oauth login", e, s);
    }
    return null;
  }
}
