import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/modules/favorite/ui/favorite_image.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

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
          'favorites_page_title',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ).tr(),
      );
    }

    Widget buildImageGrid() {
      final appSettingService = ref.watch(appSettingsServiceProvider);

      if (ref.watch(favoriteAssetProvider).isNotEmpty) {
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
                  ref.watch(favoriteAssetProvider)[index],
                  ref.watch(favoriteAssetProvider),
                );
              },
              childCount: ref.watch(favoriteAssetProvider).length,
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
      ),
    );
  }
}
