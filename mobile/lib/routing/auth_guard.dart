import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AuthGuard extends AutoRouteGuard {
  final ApiService _apiService;
  final _log = Logger("AuthGuard");
  AuthGuard(this._apiService);
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    resolver.next(true);

    try {
      var res = await _apiService.authenticationApi.validateAccessToken();
      if (res == null || res.authStatus != true) {
        // If the access token is invalid, take user back to login
        _log.fine("User token is invalid. Redirecting to login");
        router.replaceAll([const LoginRoute()]);
      }
    } on ApiException catch (e) {
      if (e.code == HttpStatus.badRequest &&
          e.innerException is SocketException) {
        // offline?
        _log.fine(
          "Unable to validate user token. User may be offline and offline browsing is allowed.",
        );
      } else {
        debugPrint("Error [onNavigation] ${e.toString()}");
        router.replaceAll([const LoginRoute()]);
        return;
      }
    } catch (e) {
      debugPrint("Error [onNavigation] ${e.toString()}");
      router.replaceAll([const LoginRoute()]);
      return;
    }
  }
}
