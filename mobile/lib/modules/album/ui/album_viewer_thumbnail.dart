import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class AlbumViewerThumbnail extends HookConsumerWidget {
  final Asset asset;
  final List<Asset> assetList;
  final bool showStorageIndicator;

  const AlbumViewerThumbnail({
    Key? key,
    required this.asset,
    required this.assetList,
    this.showStorageIndicator = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var deviceId = ref.watch(authenticationProvider).deviceId;
    final selectedAssetsInAlbumViewer =
        ref.watch(assetSelectionProvider).selectedAssetsInAlbumViewer;
    final isMultiSelectionEnable =
        ref.watch(assetSelectionProvider).isMultiselectEnable;

    _viewAsset() {
      AutoRouter.of(context).push(
        GalleryViewerRoute(
          asset: asset,
          assetList: assetList,
        ),
      );
    }

    BoxBorder drawBorderColor() {
      if (selectedAssetsInAlbumViewer.contains(asset)) {
        return Border.all(
          color: Theme.of(context).primaryColorLight,
          width: 10,
        );
      } else {
        return const Border();
      }
    }

    _enableMultiSelection() {
      ref.watch(assetSelectionProvider.notifier).enableMultiselection();
      ref
          .watch(assetSelectionProvider.notifier)
          .addAssetsInAlbumViewer([asset]);
    }

    _disableMultiSelection() {
      ref.watch(assetSelectionProvider.notifier).disableMultiselection();
    }

    _buildVideoLabel() {
      return Positioned(
        top: 5,
        right: 5,
        child: Row(
          children: [
            Text(
              asset.duration.toString().substring(0, 7),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
              ),
            ),
            const Icon(
              Icons.play_circle_outline_rounded,
              color: Colors.white,
            ),
          ],
        ),
      );
    }

    _buildAssetStoreLocationIcon() {
      return Positioned(
        right: 10,
        bottom: 5,
        child: Icon(
          (deviceId != asset.deviceId)
              ? Icons.cloud_done_outlined
              : Icons.photo_library_rounded,
          color: Colors.white,
          size: 18,
        ),
      );
    }

    _buildAssetSelectionIcon() {
      bool isSelected = selectedAssetsInAlbumViewer.contains(asset);

      return Positioned(
        left: 10,
        top: 5,
        child: isSelected
            ? Icon(
                Icons.check_circle_rounded,
                color: Theme.of(context).primaryColor,
              )
            : const Icon(
                Icons.check_circle_outline_rounded,
                color: Colors.white,
              ),
      );
    }

    _buildThumbnailImage() {
      return Container(
        decoration: BoxDecoration(border: drawBorderColor()),
        child: ImmichImage(asset, width: 300, height: 300),
      );
    }

    _handleSelectionGesture() {
      if (selectedAssetsInAlbumViewer.contains(asset)) {
        ref
            .watch(assetSelectionProvider.notifier)
            .removeAssetsInAlbumViewer([asset]);

        if (selectedAssetsInAlbumViewer.isEmpty) {
          _disableMultiSelection();
        }
      } else {
        ref
            .watch(assetSelectionProvider.notifier)
            .addAssetsInAlbumViewer([asset]);
      }
    }

    return GestureDetector(
      onTap: isMultiSelectionEnable ? _handleSelectionGesture : _viewAsset,
      onLongPress: _enableMultiSelection,
      child: Stack(
        children: [
          _buildThumbnailImage(),
          if (showStorageIndicator) _buildAssetStoreLocationIcon(),
          if (!asset.isImage) _buildVideoLabel(),
          if (isMultiSelectionEnable) _buildAssetSelectionIcon(),
        ],
      ),
    );
  }
}
