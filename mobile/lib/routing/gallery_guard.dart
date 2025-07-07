import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/routing/router.dart';

/// Guards against duplicate navigation to this route
class GalleryGuard extends AutoRouteGuard {
  const GalleryGuard();
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final newRouteName = resolver.route.name;
    final currentTopRouteName =
        router.stack.isNotEmpty ? router.stack.last.name : null;

    if (currentTopRouteName == newRouteName) {
      // Replace instead of pushing duplicate
      final args = resolver.route.args as GalleryViewerRouteArgs;

      router.replace(
        GalleryViewerRoute(
          renderList: args.renderList,
          initialIndex: args.initialIndex,
          heroOffset: args.heroOffset,
          showStack: args.showStack,
        ),
      );
      resolver.next(true);
    } else {
      resolver.next(true);
    }
  }
}
