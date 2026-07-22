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
    Future(() {
      ref.read(currentRouteNameProvider.notifier).state = route.settings.name;
      ref.read(previousRouteNameProvider.notifier).state = previousRoute?.settings.name;
      ref.read(previousRouteDataProvider.notifier).state = previousRoute?.settings;
    });
  }
}
