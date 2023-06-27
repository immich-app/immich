import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:flutter_web_auth/flutter_web_auth.dart';

// Redirect URL = app.immich://

class OAuthService {
  final ApiService _apiService;
  final callbackUrlScheme = 'app.immich';
  final log = Logger('OAuthService');
  OAuthService(this._apiService);

  Future<OAuthConfigResponseDto?> getOAuthServerConfig(
    String serverUrl,
  ) async {
    // Resolve API server endpoint from user provided serverUrl
    await _apiService.resolveAndSetEndpoint(serverUrl);

    return await _apiService.oAuthApi.generateConfig(
      OAuthConfigDto(redirectUri: '$callbackUrlScheme:/'),
    );
  }

  Future<LoginResponseDto?> oAuthLogin(String oauthUrl) async {
    try {
      var result = await FlutterWebAuth.authenticate(
        url: oauthUrl,
        callbackUrlScheme: callbackUrlScheme,
      );

      return await _apiService.oAuthApi.callback(
        OAuthCallbackDto(
          url: result,
        ),
      );
    } catch (e, stack) {
      log.severe("Error performing oAuthLogin: ${e.toString()}", e, stack);
      return null;
    }
  }
}
