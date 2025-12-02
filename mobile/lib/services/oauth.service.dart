import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:immich_mobile/models/auth/oauth_login_data.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

// Redirect URL = app.immich:///oauth-callback

class OAuthService {
  final ApiService _apiService;
  final callbackUrlScheme = 'app.immich';
  final log = Logger('OAuthService');
  OAuthService(this._apiService);

  String _generateRandomString(int length) {
    const chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890';
    final random = Random.secure();
    return String.fromCharCodes(Iterable.generate(length, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
  }

  List<int> _randomBytes(int length) {
    final random = Random.secure();
    return List<int>.generate(length, (i) => random.nextInt(256));
  }

  /// Per specification, the code verifier must be 43-128 characters long
  /// and consist of characters [A-Z, a-z, 0-9, "-", ".", "_", "~"]
  /// https://datatracker.ietf.org/doc/html/rfc7636#section-4.1
  String _randomCodeVerifier() {
    return base64Url.encode(_randomBytes(42));
  }

  String _generatePKCECodeChallenge(String codeVerifier) {
    final bytes = utf8.encode(codeVerifier);
    final digest = sha256.convert(bytes);
    return base64Url.encode(digest.bytes).replaceAll('=', '');
  }

  /// Initiates OAuth login flow.
  /// Returns the OAuth server URL to redirect to, along with PKCE parameters.
  Future<OAuthLoginData?> getOAuthLoginData(String serverUrl) async {
    final state = _generateRandomString(32);
    final codeVerifier = _randomCodeVerifier();
    final codeChallenge = _generatePKCECodeChallenge(codeVerifier);

    final oAuthServerUrl = await getOAuthServerUrl(sanitizeUrl(serverUrl), state, codeChallenge);

    if (oAuthServerUrl == null) {
      return null;
    }

    return OAuthLoginData(serverUrl: oAuthServerUrl, state: state, codeVerifier: codeVerifier);
  }

  Future<LoginResponseDto?> completeOAuthLogin(OAuthLoginData oAuthData) {
    return oAuthLogin(oAuthData.serverUrl, oAuthData.state, oAuthData.codeVerifier);
  }

  Future<String?> getOAuthServerUrl(String serverUrl, String state, String codeChallenge) async {
    // Resolve API server endpoint from user provided serverUrl
    await _apiService.resolveAndSetEndpoint(serverUrl);
    final redirectUri = '$callbackUrlScheme:///oauth-callback';
    log.info("Starting OAuth flow with redirect URI: $redirectUri");

    final dto = await _apiService.oAuthApi.startOAuth(
      OAuthConfigDto(redirectUri: redirectUri, state: state, codeChallenge: codeChallenge),
    );

    final authUrl = dto?.url;
    log.info('Received Authorization URL: $authUrl');

    return authUrl;
  }

  Future<LoginResponseDto?> oAuthLogin(String oauthUrl, String state, String codeVerifier) async {
    String result = await FlutterWebAuth2.authenticate(url: oauthUrl, callbackUrlScheme: callbackUrlScheme);

    log.info('Received OAuth callback: $result');

    if (result.startsWith('app.immich:/oauth-callback')) {
      result = result.replaceAll('app.immich:/oauth-callback', 'app.immich:///oauth-callback');
    }

    return await _apiService.oAuthApi.finishOAuth(
      OAuthCallbackDto(url: result, state: state, codeVerifier: codeVerifier),
    );
  }
}
