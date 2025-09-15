import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/utils/debug_print.dart';

/// Guards against duplicate navigation to this route
class DuplicateGuard extends AutoRouteGuard {
  const DuplicateGuard();
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    // Duplicate navigation
    if (resolver.route.name == router.current.name) {
      dPrint(() => 'DuplicateGuard: Preventing duplicate route navigation for ${resolver.route.name}');
      resolver.next(false);
    } else {
      resolver.next(true);
    }
  }
}
