import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/routing/router.dart';

/// Handles duplicate navigation to the AssetViewerRoute (primarily for deep linking).
/// When a deep link navigates to a new asset while an AssetViewerRoute is already
/// on top of the stack, this guard replaces the current route instead of blocking
/// the navigation, ensuring the new asset is displayed.
class AssetViewerGuard extends AutoRouteGuard {
  const AssetViewerGuard();
  @override
  void onNavigation(NavigationResolver resolver, StackRouter router) async {
    final newRouteName = resolver.route.name;
    final currentTopRouteName =
        router.stack.isNotEmpty ? router.stack.last.name : null;

    if (currentTopRouteName == newRouteName) {
      // Replace instead of pushing duplicate
      final args = resolver.route.args as AssetViewerRouteArgs;

      unawaited(
        router.replace(
          AssetViewerRoute(
            initialIndex: args.initialIndex,
            timelineService: args.timelineService,
            heroOffset: args.heroOffset,
            currentAlbum: args.currentAlbum,
          ),
        ),
      );
      // Prevent further navigation since we replaced the route
      resolver.next(false);
      return;
    }
    resolver.next(true);
  }
}
