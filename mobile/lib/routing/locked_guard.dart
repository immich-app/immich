import 'package:auto_route/auto_route.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/routing/router.dart';

import 'package:immich_mobile/services/api.service.dart';
import 'package:local_auth/error_codes.dart' as auth_error;
import 'package:local_auth/local_auth.dart';
import 'package:logging/logging.dart';

class LockedGuard extends AutoRouteGuard {
  final ApiService _apiService;
  final _log = Logger("AuthGuard");

  LockedGuard(this._apiService);

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final LocalAuthentication localAuth = LocalAuthentication();
    final authStatus = await _apiService.authenticationApi.getAuthStatus();
    final storage = const FlutterSecureStorage();

    if (authStatus == null) {
      resolver.next(false);
      return;
    }

    if (!authStatus.pinCode) {
      router.push(PinCodeRoute(createPinCode: true));
    }

    if (authStatus.isElevated) {
      resolver.next(true);
      return;
    }

    final securePinCode = await storage.read(key: kSecuredPinCode);
    if (securePinCode == null) {
      router.push(PinCodeRoute());
      return;
    }

    try {
      final bool didAuthenticate = await localAuth.authenticate(
        localizedReason: 'Please authenticate to access the locked page',
        options: const AuthenticationOptions(),
      );

      if (!didAuthenticate) {
        resolver.next(false);
        return;
      }
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
    }
  }
}
