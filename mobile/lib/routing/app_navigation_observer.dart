import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/routes.provider.dart';

class AppNavigationObserver extends AutoRouterObserver {
  /// Riverpod Instance
  final WidgetRef ref;

  AppNavigationObserver({required this.ref});

  @override
  void didPush(Route route, Route? previousRoute) {
    ref.invalidate(inLockedViewProvider);
    ref.invalidate(isAssetViewerOpenProvider);
    unawaited(
      Future(() {
        ref.read(currentRouteNameProvider.notifier).state = route.settings.name;
        ref.read(previousRouteNameProvider.notifier).state = previousRoute?.settings.name;
        ref.read(previousRouteDataProvider.notifier).state = previousRoute?.settings;
      }),
    );
  }

  @override
  void didPop(Route route, Route? previousRoute) {
    ref.invalidate(inLockedViewProvider);
    ref.invalidate(isAssetViewerOpenProvider);
  }
}

/// Tracks routes that are undergoing a pop transition
class TransitioningRouteObserver extends NavigatorObserver {
  int _transitioningRoutes = 0;

  /// Whether a "popping" route is still on screen
  bool get hasTransitioningRoute => _transitioningRoutes > 0;

  @override
  void didPop(Route route, Route? previousRoute) {
    if (route is! TransitionRoute) {
      return;
    }

    _transitioningRoutes += 1;
    // Transition completed and route disposed
    unawaited(route.completed.whenComplete(() => _transitioningRoutes -= 1));
  }
}
