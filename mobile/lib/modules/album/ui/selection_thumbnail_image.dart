import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';

class SelectionThumbnailImage extends HookConsumerWidget {
  final Asset asset;

  const SelectionThumbnailImage({Key? key, required this.asset})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var selectedAsset =
        ref.watch(assetSelectionProvider).selectedNewAssetsForAlbum;
    var newAssetsForAlbum =
        ref.watch(assetSelectionProvider).selectedAdditionalAssetsForAlbum;
    var isAlbumExist = ref.watch(assetSelectionProvider).isAlbumExist;

    Widget _buildSelectionIcon(Asset asset) {
      var isSelected = selectedAsset.map((item) => item.id).contains(asset.id);
      var isNewlySelected =
          newAssetsForAlbum.map((item) => item.id).contains(asset.id);

      if (isSelected && !isAlbumExist) {
        return Icon(
          Icons.check_circle,
          color: Theme.of(context).primaryColor,
        );
      } else if (isSelected && isAlbumExist) {
        return const Icon(
          Icons.check_circle,
          color: Color.fromARGB(255, 233, 233, 233),
        );
      } else if (isNewlySelected && isAlbumExist) {
        return Icon(
          Icons.check_circle,
          color: Theme.of(context).primaryColor,
        );
      } else {
        return const Icon(
          Icons.circle_outlined,
          color: Colors.white,
        );
      }
    }

    BoxBorder drawBorderColor() {
      var isSelected = selectedAsset.map((item) => item.id).contains(asset.id);
      var isNewlySelected =
          newAssetsForAlbum.map((item) => item.id).contains(asset.id);

      if (isSelected && !isAlbumExist) {
        return Border.all(
          color: Theme.of(context).primaryColorLight,
          width: 10,
        );
      } else if (isSelected && isAlbumExist) {
        return Border.all(
          color: const Color.fromARGB(255, 190, 190, 190),
          width: 10,
        );
      } else if (isNewlySelected && isAlbumExist) {
        return Border.all(
          color: Theme.of(context).primaryColorLight,
          width: 10,
        );
      }
      return const Border();
    }

    return GestureDetector(
      onTap: () {
        var isSelected =
            selectedAsset.map((item) => item.id).contains(asset.id);
        var isNewlySelected =
            newAssetsForAlbum.map((item) => item.id).contains(asset.id);

        if (isAlbumExist) {
          // Operation for existing album
          if (!isSelected) {
            if (isNewlySelected) {
              ref
                  .watch(assetSelectionProvider.notifier)
                  .removeSelectedAdditionalAssets([asset]);
            } else {
              ref
                  .watch(assetSelectionProvider.notifier)
                  .addAdditionalAssets([asset]);
            }
          }
        } else {
          // Operation for new album
          if (isSelected) {
            ref
                .watch(assetSelectionProvider.notifier)
                .removeSelectedNewAssets([asset]);
          } else {
            ref.watch(assetSelectionProvider.notifier).addNewAssets([asset]);
          }
        }
      },
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(border: drawBorderColor()),
            child: ImmichImage(asset, width: 150, height: 150),
          ),
          Padding(
            padding: const EdgeInsets.all(3.0),
            child: Align(
              alignment: Alignment.topLeft,
              child: _buildSelectionIcon(asset),
            ),
          ),
          if (!asset.isImage)
            Positioned(
              bottom: 5,
              right: 5,
              child: Row(
                children: [
                  Text(
                    asset.duration.substring(0, 7),
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
            ),
        ],
      ),
    );
  }
}
