import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AppNavigationObserver extends AutoRouterObserver {
  /// Riverpod Instance
  final WidgetRef ref;

  AppNavigationObserver({
    required this.ref,
  });

  @override
  Future<void> didChangeTabRoute(
    TabPageRoute route,
    TabPageRoute previousRoute,
  ) async {
    Future(
      () => ref.read(inLockedViewProvider.notifier).state = false,
    );
  }

  @override
  void didPush(Route route, Route? previousRoute) {
    _handleLockedViewState(route, previousRoute);
  }

  _handleLockedViewState(Route route, Route? previousRoute) {
    final isInLockedView = ref.read(inLockedViewProvider);
    final isFromLockedViewToDetailView =
        route.settings.name == GalleryViewerRoute.name &&
            previousRoute?.settings.name == LockedRoute.name;

    final isFromDetailViewToInfoPanelView = route.settings.name == null &&
        previousRoute?.settings.name == GalleryViewerRoute.name &&
        isInLockedView;

    if (route.settings.name == LockedRoute.name ||
        isFromLockedViewToDetailView ||
        isFromDetailViewToInfoPanelView) {
      Future(
        () => ref.read(inLockedViewProvider.notifier).state = true,
      );
    } else {
      Future(
        () => ref.read(inLockedViewProvider.notifier).state = false,
      );
    }
  }
}
