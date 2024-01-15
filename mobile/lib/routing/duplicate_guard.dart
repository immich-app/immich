import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';

/// Guards against duplicate navigation to this route
class DuplicateGuard extends AutoRouteGuard {
  DuplicateGuard();
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    // Duplicate navigation
    if (resolver.route.name == router.current.name) {
      debugPrint(
        'DuplicateGuard: Preventing duplicate route navigation for ${resolver.route.name}',
      );
      resolver.next(false);
    } else {
      resolver.next(true);
    }
  }
}
