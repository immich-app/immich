import 'package:auto_route/auto_route.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/constants/constants.dart';
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

    /// Check if a pincode has been created but this user. Show the form to create if not exist
    if (!authStatus.pinCode) {
      router.push(PinAuthRoute(createPinCode: true));
    }

    if (authStatus.isElevated) {
      resolver.next(true);
      return;
    }

    /// Check if the user has the pincode saved in secure storage, meaning
    /// the user has enabled the biometric authentication
    final securePinCode = await _secureStorageService.read(kSecuredPinCode);
    if (securePinCode == null) {
      router.push(PinAuthRoute());
      return;
    }

    try {
      final bool isAuth = await _localAuth.authenticate();

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
      await _secureStorageService.delete(kSecuredPinCode);
      router.push(PinAuthRoute());
    } catch (error) {
      _log.severe("Failed to access locked page", error);
      resolver.next(false);
    }
  }
}
