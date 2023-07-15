import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AuthGuard extends AutoRouteGuard {
  final ApiService _apiService;
  AuthGuard(this._apiService);
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    var log = Logger("AuthGuard");

    // Check if user set offline browsing access
    bool offlineBrowingIsAllowed =
        Store.tryGet(StoreKey.offlineBrowsing) == true;

    bool resolveNext = false;

    // If offline browsing is allowed, we allow the resolve to continue so we don't
    // wait around for the validateAccessToken() to resolve
    if (offlineBrowingIsAllowed) {
      resolver.next(true);
      resolveNext = true;
    }

    try {
      var res = await _apiService.authenticationApi.validateAccessToken();
      // If token is valid and we haven't resolved yet, resolve
      if (res != null && res.authStatus) {
        if (!resolveNext) {
          resolver.next(true);
        }
      } else {
        // Whenever the accessToken endpoint does resolve (if online), take the user back to Login
        log.info("User token is invalid. Redirecting to login");
        router.replaceAll([const LoginRoute()]);
      }
    } on ApiException catch (e) {
      if (offlineBrowingIsAllowed &&
          e.code == HttpStatus.badRequest &&
          e.innerException is SocketException) {
        // offline?
        log.info(
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
