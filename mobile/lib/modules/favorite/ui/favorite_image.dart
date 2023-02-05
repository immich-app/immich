
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class FavoriteImage extends HookConsumerWidget {
  final Asset asset;
  final List<Asset> assets;

  const FavoriteImage(this.asset, this.assets, {super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void viewAsset() {
      AutoRouter.of(context).push(
        GalleryViewerRoute(
          asset: asset,
          assetList: assets,
        ),
      );
    }

    return GestureDetector(
      onTap: viewAsset,
      child: ImmichImage(
        asset,
        width: 300,
        height: 300,
      ),
    );
  }

}