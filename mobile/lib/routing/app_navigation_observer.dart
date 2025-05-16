import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

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
    if (route.name == 'HomeRoute') {
      ref.invalidate(memoryFutureProvider);
      Future(() => ref.read(assetProvider.notifier).getAllAsset());

      // Update user info
      try {
        ref.read(userServiceProvider).refreshMyUser();
        ref.read(serverInfoProvider.notifier).getServerVersion();
      } catch (e) {
        debugPrint("Error refreshing user info $e");
      }
    }
  }

  @override
  void didPush(Route route, Route? previousRoute) {
    _handleLockedViewState(route, previousRoute);
  }

  _handleLockedViewState(Route route, Route? previousRoute) {
    final isInLockedView = ref.read(inLockedViewProvider);
    final isFromLockedViewToDetailView =
        route.settings.name == "GalleryViewerRoute" &&
            previousRoute?.settings.name == "LockedRoute";

    final isFromDetailViewToInfoPanelView = route.settings.name == null &&
        previousRoute?.settings.name == "GalleryViewerRoute" &&
        isInLockedView;

    if (route.settings.name == "LockedRoute" ||
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
