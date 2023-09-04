import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/memories/providers/memory.provider.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';

import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';

class TabNavigationObserver extends AutoRouterObserver {
  /// Riverpod Instance
  final WidgetRef ref;

  TabNavigationObserver({
    required this.ref,
  });

  @override
  void didInitTabRoute(TabPageRoute route, TabPageRoute? previousRoute) {
    // Perform tasks on first navigation to SearchRoute
    if (route.name == 'SearchRoute') {
      // ref.refresh(getCuratedLocationProvider);
    }
  }

  @override
  Future<void> didChangeTabRoute(
    TabPageRoute route,
    TabPageRoute previousRoute,
  ) async {
    // Perform tasks on re-visit to SearchRoute
    if (route.name == 'SearchRoute') {
      // Refresh Location State
      ref.invalidate(getCuratedLocationProvider);
      ref.invalidate(getCuratedPeopleProvider);
    }

    if (route.name == 'SharingRoute') {
      ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();
    }

    if (route.name == 'LibraryRoute') {
      ref.read(albumProvider.notifier).getAllAlbums();
    }

    if (route.name == 'HomeRoute') {
      ref.invalidate(memoryFutureProvider);

      // Update user info
      try {
        final userResponseDto =
            await ref.read(apiServiceProvider).userApi.getMyUserInfo();

        if (userResponseDto == null) {
          return;
        }

        Store.put(StoreKey.currentUser, User.fromDto(userResponseDto));
      } catch (e) {
        debugPrint("Error refreshing user info $e");
      }
    }
    ref.watch(serverInfoProvider.notifier).getServerVersion();
  }
}
