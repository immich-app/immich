import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/shared/services/api.service.dart';

class AuthGuard extends AutoRouteGuard {
  final ApiService _apiService;
  AuthGuard(this._apiService);
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    try {
      var test = await _apiService.authenticationApi.validateAccessToken();

      if (test == null) {
        router.removeUntil((route) => route.name == "LoginRoute");
      } else {
        if (test.authStatus) {
          resolver.next(true);
        } else {
          router.removeUntil((route) => route.name == "LoginRoute");
        }
      }
    } catch (e) {
      debugPrint("Error [onNavigation] ${e.toString()}");
      router.removeUntil((route) => route.name == "LoginRoute");
      return;
    }
  }
}
