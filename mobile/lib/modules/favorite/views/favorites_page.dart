import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/modules/favorite/ui/favorite_image.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class FavoritesPage extends HookConsumerWidget {
  const FavoritesPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AppBar buildAppBar() {
      return AppBar(
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        title: const Text(
          'Favorites',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      );
    }

    Widget buildImageGrid() {
      final appSettingService = ref.watch(appSettingsServiceProvider);
      final bool showStorageIndicator =
          appSettingService.getSetting(AppSettingsEnum.storageIndicator);

      if (ref.watch(favoriteProvider).isNotEmpty) {
        return SliverPadding(
          padding: const EdgeInsets.only(top: 10.0),
          sliver: SliverGrid(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:
                  appSettingService.getSetting(AppSettingsEnum.tilesPerRow),
              crossAxisSpacing: 5.0,
              mainAxisSpacing: 5,
            ),
            delegate: SliverChildBuilderDelegate(
              (
                BuildContext context,
                int index,
              ) {
                return FavoriteImage(
                    ref.watch(favoriteProvider)[index],
                    ref.watch(favoriteProvider)
                );
              },
              childCount: ref.watch(favoriteProvider).length,
            ),
          ),
        );
      }
      return const SliverToBoxAdapter();
    }

    return Scaffold(
        appBar: buildAppBar(),
        body: CustomScrollView(
          slivers: [buildImageGrid()],
        ));
  }
}
