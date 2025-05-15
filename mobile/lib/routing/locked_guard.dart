import 'package:auto_route/auto_route.dart';
import 'package:flutter/services.dart';
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

    if (authStatus == null) {
      resolver.next(false);
      return;
    }

    router.push(PinCodeRoute(createPinCode: true));

    // if (!authStatus.pinCode) {
    //   router.push(PinCodeRoute(createPinCode: true));
    // }

    // try {
    //   final bool didAuthenticate = await localAuth.authenticate(
    //     localizedReason: 'Please authenticate to access the page',
    //     options: const AuthenticationOptions(),
    //   );

    //   if (didAuthenticate) {
    //     resolver.next(true);
    //   }
    // } on PlatformException catch (error) {
    //   switch (error.code) {
    //     case auth_error.notAvailable:
    //       print("notAvailable: $error");
    //       break;
    //     case auth_error.notEnrolled:
    //       print("not enrolled");
    //       break;
    //     default:
    //       print("error");
    //       break;
    //   }
    // }
  }
}
