import 'dart:async';
import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class AuthGuard extends AutoRouteGuard {
  final ApiService _apiService;
  final AuthService _authService;
  final _log = Logger("AuthGuard");
  bool _validateInFlight = false;
  AuthGuard(this._apiService, this._authService);
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) {
    // Synchronously check for the access token. auto_route awaits async
    // guards, so we keep this function fully sync and validate the token in
    // the background — otherwise a slow validateAccessToken() request would
    // block the route transition for as long as the OS-level HTTP timeout.
    try {
      Store.get(StoreKey.accessToken);
    } on StoreKeyNotFoundException catch (_) {
      _log.warning('No access token in the store.');
      resolver.next(false);
      unawaited(router.replaceAll([const LoginRoute()]));
      return;
    }

    resolver.next(true);
    unawaited(_validateAccessTokenInBackground(router));
  }

  Future<void> _validateAccessTokenInBackground(StackRouter router) async {
    if (_validateInFlight) {
      return;
    }
    final token = Store.tryGet(StoreKey.accessToken);
    if (token == null) {
      return;
    }
    _validateInFlight = true;
    try {
      final res = await _apiService.authenticationApi.validateAccessToken();
      if (res == null || res.authStatus != true) {
        // Token may have changed during validation (user logged out + logged in
        // again); only act if it still applies to the current session.
        if (Store.tryGet(StoreKey.accessToken) != token) {
          return;
        }
        _log.fine('User token is invalid. Redirecting to login');
        await router.replaceAll([const LoginRoute()]);
        await _authService.clearLocalData();
      }
    } on ApiException catch (e) {
      if (e.code != HttpStatus.unauthorized) {
        return;
      }
      if (Store.tryGet(StoreKey.accessToken) != token) {
        return;
      }
      _log.warning("Unauthorized access token.");
      await router.replaceAll([const LoginRoute()]);
      await _authService.clearLocalData();
    } catch (e) {
      _log.warning('Error validating access token from server: $e');
    } finally {
      _validateInFlight = false;
    }
  }
}
