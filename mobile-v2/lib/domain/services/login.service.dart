import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class LoginService with LogMixin {
  const LoginService();

  Future<bool> isEndpointAvailable(Uri uri, {ImmichApiClient? client}) async {
    String baseUrl = uri.toString();

    if (!baseUrl.endsWith('/api')) {
      baseUrl += '/api';
    }

    final serverAPI = client?.getServerApi() ??
        ImmichApiClient(endpoint: baseUrl).getServerApi();
    try {
      await serverAPI.pingServer();
    } catch (e) {
      log.e("Exception occured while validating endpoint", e);
      return false;
    }
    return true;
  }

  Future<String> resolveEndpoint(Uri uri, {Client? client}) async {
    String baseUrl = uri.toString();
    final d = client ?? ImmichApiClient(endpoint: baseUrl).client;

    try {
      // Check for well-known endpoint
      final res = await d.get(
        Uri.parse("$baseUrl/.well-known/immich"),
        headers: {"Accept": "application/json"},
      );

      if (res.statusCode == HttpStatus.ok) {
        final data = await compute(jsonDecode, res.body);
        final endpoint = data['api']['endpoint'].toString();

        // Full URL is relative to base
        return endpoint.startsWith('/') ? "$baseUrl$endpoint" : endpoint;
      }
    } catch (e) {
      log.e("Could not locate /.well-known/immich at $baseUrl", e);
    }

    // No well-known, return the baseUrl
    return baseUrl;
  }

  Future<String?> passwordLogin(String email, String password) async {
    try {
      final loginResponse =
          await di<ImmichApiClient>().getAuthenticationApi().login(
                LoginCredentialDto(email: email, password: password),
              );

      return loginResponse?.accessToken;
    } catch (e, s) {
      log.e("Exception occured while performing password login", e, s);
    }
    return null;
  }

  Future<String?> oAuthLogin() async {
    const String oAuthCallbackSchema = 'app.immich';

    final oAuthApi = di<ImmichApiClient>().getOAuthApi();

    try {
      final oAuthUrl = await oAuthApi.startOAuth(
        OAuthConfigDto(redirectUri: "$oAuthCallbackSchema:/"),
      );

      final oAuthUrlRes = oAuthUrl?.url;
      if (oAuthUrlRes == null) {
        log.e(
          "oAuth Server URL not available. Kindly ensure oAuth login is enabled in the server",
        );
        return null;
      }

      final oAuthCallbackUrl = await FlutterWebAuth2.authenticate(
        url: oAuthUrlRes,
        callbackUrlScheme: oAuthCallbackSchema,
      );

      final loginResponse = await oAuthApi.finishOAuth(
        OAuthCallbackDto(url: oAuthCallbackUrl),
      );

      return loginResponse?.accessToken;
    } catch (e) {
      log.e("Exception occured while performing oauth login", e);
    }
    return null;
  }

  Future<bool> tryAutoLogin() async {
    final serverEndpoint =
        await di<IStoreRepository>().tryGet(StoreKey.serverEndpoint);
    if (serverEndpoint == null) {
      return false;
    }

    ServiceLocator.registerApiClient(serverEndpoint);
    ServiceLocator.registerPostValidationServices();
    ServiceLocator.registerPostGlobalStates();

    final accessToken =
        await di<IStoreRepository>().tryGet(StoreKey.accessToken);
    if (accessToken == null) {
      return false;
    }

    /// Set token to interceptor
    await di<ImmichApiClient>().init(accessToken: accessToken);

    final user = await di<UserService>().getMyUser();
    if (user == null) {
      return false;
    }

    ServiceLocator.registerCurrentUser(user);
    return true;
  }
}
