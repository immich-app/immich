import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

// Redirect URL = app.immich:///oauth-callback

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
    final redirectUri = '$callbackUrlScheme:///oauth-callback';
    log.info(
      "Starting OAuth flow with redirect URI: $redirectUri",
    );

    final dto = await _apiService.oAuthApi.startOAuth(
      OAuthConfigDto(redirectUri: redirectUri),
    );

    final authUrl = dto?.url;
    log.info('Received Authorization URL: $authUrl');

    return authUrl;
  }

  Future<LoginResponseDto?> oAuthLogin(String oauthUrl) async {
    String result = await FlutterWebAuth2.authenticate(
      url: oauthUrl,
      callbackUrlScheme: callbackUrlScheme,
    );

    log.info('Received OAuth callback: $result');

    if (result.startsWith('app.immich:/oauth-callback')) {
      result = result.replaceAll(
        'app.immich:/oauth-callback',
        'app.immich:///oauth-callback',
      );
    }

    return await _apiService.oAuthApi.finishOAuth(
      OAuthCallbackDto(
        url: result,
      ),
    );
  }
}
