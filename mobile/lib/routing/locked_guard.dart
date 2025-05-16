import 'package:auto_route/auto_route.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/routing/router.dart';

import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/local_auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:local_auth/error_codes.dart' as auth_error;
import 'package:logging/logging.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart';

class LockedGuard extends AutoRouteGuard {
  final ApiService _apiService;
  final SecureStorageService _secureStorageService;
  final LocalAuthService _localAuth;
  final _log = Logger("AuthGuard");

  LockedGuard(
    this._apiService,
    this._secureStorageService,
    this._localAuth,
  );

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final authStatus = await _apiService.authenticationApi.getAuthStatus();

    if (authStatus == null) {
      resolver.next(false);
      return;
    }

    if (!authStatus.pinCode) {
      router.push(PinAuthRoute(createPinCode: true));
    }

    if (authStatus.isElevated) {
      resolver.next(true);
      return;
    }

    final securePinCode = await _secureStorageService.getPinCode();
    if (securePinCode == null) {
      router.push(PinAuthRoute());
      return;
    }

    try {
      final bool isAuth = await _localAuth.authenticate(null);

      if (!isAuth) {
        resolver.next(false);
        return;
      }

      await _apiService.authenticationApi.unlockAuthSession(
        SessionUnlockDto(pinCode: securePinCode),
      );

      resolver.next(true);
    } on PlatformException catch (error) {
      switch (error.code) {
        case auth_error.notAvailable:
          _log.severe("notAvailable: $error");
          break;
        case auth_error.notEnrolled:
          _log.severe("not enrolled");
          break;
        default:
          _log.severe("error");
          break;
      }

      resolver.next(false);
    } on ApiException {
      // PIN code has changed, need to re-enter to access
      await _secureStorageService.deletePinCode();
      router.push(PinAuthRoute());
    } catch (error) {
      _log.severe("Failed to access locked page", error);
      resolver.next(false);
    }
  }
}
