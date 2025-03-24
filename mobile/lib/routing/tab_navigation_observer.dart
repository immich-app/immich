import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';

class TabNavigationObserver extends AutoRouterObserver {
  /// Riverpod Instance
  final WidgetRef ref;

  TabNavigationObserver({
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
}
