import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/providers/search/people.provider.dart';

import 'package:immich_mobile/providers/search/search_page_state.provider.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
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
    // Perform tasks on re-visit to SearchRoute
    if (route.name == 'SearchRoute') {
      // Refresh Location State
      ref.invalidate(getPreviewPlacesProvider);
      ref.invalidate(getAllPeopleProvider);
    }

    if (route.name == 'HomeRoute') {
      ref.invalidate(memoryFutureProvider);
      Future(() => ref.read(assetProvider.notifier).getAllAsset());

      // Update user info
      try {
        final userResponseDto =
            await ref.read(apiServiceProvider).usersApi.getMyUser();
        final userPreferences =
            await ref.read(apiServiceProvider).usersApi.getMyPreferences();

        if (userResponseDto == null) {
          return;
        }

        Store.put(
          StoreKey.currentUser,
          User.fromUserDto(userResponseDto, userPreferences),
        );
        ref.read(serverInfoProvider.notifier).getServerVersion();
      } catch (e) {
        debugPrint("Error refreshing user info $e");
      }
    }
  }
}
