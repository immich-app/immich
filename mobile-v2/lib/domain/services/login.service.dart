import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:openapi/openapi.dart';

class LoginService with LogContext {
  const LoginService();

  Future<bool> isEndpointAvailable(Uri uri, {Dio? dio}) async {
    String baseUrl = uri.toString();

    if (!baseUrl.endsWith('/api')) {
      baseUrl += '/api';
    }

    final serverAPI =
        Openapi(dio: dio, basePathOverride: baseUrl, interceptors: [])
            .getServerInfoApi();
    try {
      await serverAPI.pingServer(validateStatus: (status) => status == 200);
    } catch (e) {
      log.severe("Exception occured while validating endpoint", e);
      return false;
    }
    return true;
  }

  Future<String> resolveEndpoint(Uri uri, {Dio? dio}) async {
    final d = dio ?? Dio();
    String baseUrl = uri.toString();

    try {
      // Check for well-known endpoint
      final res = await d.get(
        "$baseUrl/.well-known/immich",
        options: Options(
          headers: {"Accept": "application/json"},
          validateStatus: (status) => status == 200,
        ),
      );

      final data = jsonDecode(res.data);
      final endpoint = data['api']['endpoint'].toString();

      // Full URL is relative to base
      return endpoint.startsWith('/') ? "$baseUrl$endpoint" : endpoint;
    } catch (e) {
      log.fine("Could not locate /.well-known/immich at $baseUrl", e);
    }

    // No well-known, return the baseUrl
    return baseUrl;
  }

  Future<String?> passwordLogin(String email, String password) async {
    try {
      final loginResponse = await di<Openapi>().getAuthenticationApi().login(
        loginCredentialDto: LoginCredentialDto((builder) {
          builder.email = email;
          builder.password = password;
        }),
      );

      return loginResponse.data?.accessToken;
    } catch (e, s) {
      log.severe("Exception occured while performing password login", e, s);
    }
    return null;
  }

  Future<String?> oAuthLogin() async {
    const String oAuthCallbackSchema = 'app.immich';

    final oAuthApi = di<Openapi>().getOAuthApi();

    try {
      final oAuthUrl = await oAuthApi.startOAuth(
        oAuthConfigDto: OAuthConfigDto((builder) {
          builder.redirectUri = "$oAuthCallbackSchema:/";
        }),
      );

      final oAuthUrlRes = oAuthUrl.data?.url;
      if (oAuthUrlRes == null) {
        log.severe(
          "oAuth Server URL not available. Kindly ensure oAuth login is enabled in the server",
        );
        return null;
      }

      final oAuthCallbackUrl = await FlutterWebAuth2.authenticate(
        url: oAuthUrlRes,
        callbackUrlScheme: oAuthCallbackSchema,
      );

      final loginResponse = await oAuthApi.finishOAuth(
        oAuthCallbackDto: OAuthCallbackDto((builder) {
          builder.url = oAuthCallbackUrl;
        }),
      );

      return loginResponse.data?.accessToken;
    } catch (e) {
      log.severe("Exception occured while performing oauth login", e);
    }
    return null;
  }
}
