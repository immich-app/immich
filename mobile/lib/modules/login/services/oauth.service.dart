import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:flutter_web_auth/flutter_web_auth.dart';

// Redirect URL = app.immich://

class OAuthService {
  final ApiService _apiService;
  final callbackUrlScheme = 'app.immich';

  OAuthService(this._apiService);

  Future<OAuthConfigResponseDto?> getOAuthServerConfig(
    String serverEndpoint,
  ) async {
    _apiService.setEndpoint(serverEndpoint);

    return await _apiService.oAuthApi.generateConfig(
      OAuthConfigDto(redirectUri: '$callbackUrlScheme:/'),
    );
  }

  oAuthLogin(String oauthUrl) async {
    try {
      // await launchUrl(Uri.parse(oauthUrl));
      var result = await FlutterWebAuth.authenticate(
        url: oauthUrl,
        callbackUrlScheme: callbackUrlScheme,
      );
      print("oAuthLogin Result URL $result");

      var loginResult = await _apiService.oAuthApi.callback(
        OAuthCallbackDto(
          url: result,
        ),
      );

      print("oAuthLogin Login Result $loginResult");
    } catch (e) {
      print("Error: $e");
    }
  }
}

// Redirect URL = app.immich:/