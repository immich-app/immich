import 'package:auto_route/auto_route.dart';

class DuplicateGuard extends AutoRouteGuard {
  const DuplicateGuard();

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) {
    resolver.next(resolver.route.name != router.current.name);
  }
}
