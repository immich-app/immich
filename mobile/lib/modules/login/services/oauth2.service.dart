import 'package:flutter/foundation.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:hive/hive.dart';
import '../../../constants/hive_box.dart';

const FlutterAppAuth appAuth = FlutterAppAuth();
const oAuth2RedirectUri = 'app.alextran.immich://login-callback';

class OAuth2Service {

  static Future<bool> tryLogin(String discoveryUrl, String clientId) async {
    debugPrint("Trying OAuth2/OIDC auth");

    if (!discoveryUrl.startsWith("https://")) return false;

    var oAuth2Token = await OAuth2Service.getToken(discoveryUrl, clientId);
    if (oAuth2Token == null) {
      debugPrint("OAuth2/OIDC auth failed");
      return false;
    }

    debugPrint("OAuth2/OIDC auth successful");

    Hive.box(userInfoBox).put(accessTokenKey, oAuth2Token.idToken);
    Hive.box(userInfoBox).put(refreshTokenKey, oAuth2Token.refreshToken);

    return true;
  }

  static Future<AuthorizationTokenResponse?> getToken(discoveryUrl, clientId) async {
    try {
      return await appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          clientId,
          oAuth2RedirectUri,
          discoveryUrl: discoveryUrl,
          scopes: ['openid', 'profile', 'email'],
        ),
      );
    } catch (e) {
      return null;
    }
  }

}