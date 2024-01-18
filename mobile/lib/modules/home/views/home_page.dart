import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/modules/memories/ui/memory_lane.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/shared/ui/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/shared/ui/immich_app_bar.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

@RoutePage()
class HomePage extends HookConsumerWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    final timelineUsers = ref.watch(timelineUsersIdsProvider);
    final tipOneOpacity = useState(0.0);
    final refreshCount = useState(0);

    useEffect(
      () {
        ref.read(websocketProvider.notifier).connect();
        Future(() => ref.read(assetProvider.notifier).getAllAsset());
        ref.read(assetProvider.notifier).getPartnerAssets();
        ref.read(albumProvider.notifier).getAllAlbums();
        ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();
        ref.read(serverInfoProvider.notifier).getServerInfo();
        return;
      },
      [],
    );
    Widget buildLoadingIndicator() {
      Timer(const Duration(seconds: 2), () => tipOneOpacity.value = 1);

      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const ImmichLoadingIndicator(),
            Padding(
              padding: const EdgeInsets.only(top: 16.0),
              child: Text(
                'home_page_building_timeline',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: context.primaryColor,
                ),
              ).tr(),
            ),
            AnimatedOpacity(
              duration: const Duration(milliseconds: 500),
              opacity: tipOneOpacity.value,
              child: SizedBox(
                width: 250,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: const Text(
                    'home_page_first_time_notice',
                    textAlign: TextAlign.justify,
                    style: TextStyle(
                      fontSize: 12,
                    ),
                  ).tr(),
                ),
              ),
            ),
          ],
        ),
      );
    }

    Future<void> refreshAssets() async {
      final fullRefresh = refreshCount.value > 0;
      await ref.read(assetProvider.notifier).getAllAsset(clear: fullRefresh);
      if (timelineUsers.length > 1) {
        await ref.read(assetProvider.notifier).getPartnerAssets();
      }
      if (fullRefresh) {
        // refresh was forced: user requested another refresh within 2 seconds
        refreshCount.value = 0;
      } else {
        refreshCount.value++;
        // set counter back to 0 if user does not request refresh again
        Timer(const Duration(seconds: 4), () => refreshCount.value = 0);
      }
    }

    return Scaffold(
      appBar: ref.watch(multiselectProvider) ? null : const ImmichAppBar(),
      body: MultiselectGrid(
        topWidget: (currentUser != null && currentUser.memoryEnabled)
            ? const MemoryLane()
            : const SizedBox(),
        renderListProvider: timelineUsers.length > 1
            ? multiUserAssetsProvider(timelineUsers)
            : assetsProvider(currentUser?.isarId),
        buildLoadingIndicator: buildLoadingIndicator,
        onRefresh: refreshAssets,
        stackEnabled: true,
        archiveEnabled: true,
        editEnabled: true,
      ),
    );
  }
}
