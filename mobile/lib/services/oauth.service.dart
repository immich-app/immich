import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:flutter_web_auth/flutter_web_auth.dart';

// Redirect URL = app.immich://

class OAuthService {
  final ApiService _apiService;
  final callbackUrlScheme = 'app.immich';
  final log = Logger('OAuthService');
  OAuthService(this._apiService);

  Future<String?> getOAuthServerUrl(
    String serverUrl,
  ) async {
    // Resolve API server endpoint from user provided serverUrl
    await _apiService.resolveAndSetEndpoint(serverUrl);

    final dto = await _apiService.oAuthApi.startOAuth(
      OAuthConfigDto(redirectUri: '$callbackUrlScheme:/'),
    );
    return dto?.url;
  }

  Future<LoginResponseDto?> oAuthLogin(String oauthUrl) async {
    try {
      var result = await FlutterWebAuth.authenticate(
        url: oauthUrl,
        callbackUrlScheme: callbackUrlScheme,
      );

      return await _apiService.oAuthApi.finishOAuth(
        OAuthCallbackDto(
          url: result,
        ),
      );
    } catch (e, stack) {
      log.severe("OAuth login failed", e, stack);
      return null;
    }
  }
}
