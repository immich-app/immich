import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/modules/favorite/ui/favorite_image.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';

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
      final favorites = ref.watch(favoriteAssetProvider);

      void viewAsset(Asset asset) {
        AutoRouter.of(context).push(
          GalleryViewerRoute(
            asset: asset,
            assetList: favorites,
          ),
        );
      }

      return LayoutBuilder(
        builder: (context, constraints) {
          final crossAxisCount = constraints.maxWidth > 500 ? 4 : 2;
          return  GridView.builder(
            itemCount: favorites.length,
            gridDelegate: SliverQuiltedGridDelegate(
              crossAxisCount: crossAxisCount,
              mainAxisSpacing: 5,
              crossAxisSpacing: 5,
              repeatPattern: QuiltedGridRepeatPattern.inverted,
              pattern: [
                const QuiltedGridTile(2, 2),
                const QuiltedGridTile(1, 1),
                const QuiltedGridTile(1, 1),
                const QuiltedGridTile(1, 2),
              ],
            ),
            itemBuilder: (
                    BuildContext context,
                    int index,
                  ) => FavoriteImage(
                      asset: favorites[index],
                      onTap: () => viewAsset(favorites[index]),
                    ),
          );
        },
      );
    }

    return Scaffold(
      appBar: buildAppBar(),
      body:  buildImageGrid(),
    );
  }
}
