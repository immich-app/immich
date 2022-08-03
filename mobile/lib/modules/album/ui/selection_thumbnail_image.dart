import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/providers/asset_selection.provider.dart';
import 'package:openapi/api.dart';

class SelectionThumbnailImage extends HookConsumerWidget {
  final AssetResponseDto asset;

  const SelectionThumbnailImage({Key? key, required this.asset})
      : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cacheKey = useState(1);
    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl =
        '${box.get(serverEndpointKey)}/asset/thumbnail/${asset.id}';
    var selectedAsset =
        ref.watch(assetSelectionProvider).selectedNewAssetsForAlbum;
    var newAssetsForAlbum =
        ref.watch(assetSelectionProvider).selectedAdditionalAssetsForAlbum;
    var isAlbumExist = ref.watch(assetSelectionProvider).isAlbumExist;

    Widget _buildSelectionIcon(AssetResponseDto asset) {
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
            child: CachedNetworkImage(
              cacheKey: "${asset.id}-${cacheKey.value}",
              width: 150,
              height: 150,
              memCacheHeight: asset.type == AssetTypeEnum.IMAGE ? 150 : 150,
              fit: BoxFit.cover,
              imageUrl: thumbnailRequestUrl,
              httpHeaders: {
                "Authorization": "Bearer ${box.get(accessTokenKey)}"
              },
              fadeInDuration: const Duration(milliseconds: 250),
              progressIndicatorBuilder: (context, url, downloadProgress) =>
                  Transform.scale(
                scale: 0.2,
                child:
                    CircularProgressIndicator(value: downloadProgress.progress),
              ),
              errorWidget: (context, url, error) {
                return Icon(
                  Icons.image_not_supported_outlined,
                  color: Theme.of(context).primaryColor,
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(3.0),
            child: Align(
              alignment: Alignment.topLeft,
              child: _buildSelectionIcon(asset),
            ),
          ),
          if (asset.type != AssetTypeEnum.IMAGE)
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
