import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class LocalGalleryPermissionGuard extends AutoRouteGuard {
  final GalleryPermissionNotifier _permission;
  final PageRouteInfo nextRoute;

  LocalGalleryPermissionGuard(this._permission, {required this.nextRoute});

  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final p = _permission.hasPermission;
    if (p) {
      resolver.next(true);
    } else {
      router.push(PermissionOnboardingRoute(nextRoute: nextRoute));
    }
  }
}
