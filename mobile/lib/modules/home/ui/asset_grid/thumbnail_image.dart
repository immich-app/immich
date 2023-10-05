import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/storage_indicator.dart';

class ThumbnailImage extends StatelessWidget {
  final Asset asset;
  final int index;
  final Asset Function(int index) loadAsset;
  final int totalAssets;
  final bool showStorageIndicator;
  final bool useGrayBoxPlaceholder;
  final bool isSelected;
  final bool multiselectEnabled;
  final Function? onSelect;
  final Function? onDeselect;
  final int heroOffset;

  const ThumbnailImage({
    Key? key,
    required this.asset,
    required this.index,
    required this.loadAsset,
    required this.totalAssets,
    this.showStorageIndicator = true,
    this.useGrayBoxPlaceholder = false,
    this.isSelected = false,
    this.multiselectEnabled = false,
    this.onDeselect,
    this.onSelect,
    this.heroOffset = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDarkTheme = Theme.of(context).brightness == Brightness.dark;
    final assetContainerColor =
        isDarkTheme ? Colors.blueGrey : Theme.of(context).primaryColorLight;

    Widget buildSelectionIcon(Asset asset) {
      if (isSelected) {
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: assetContainerColor,
          ),
          child: Icon(
            Icons.check_circle_rounded,
            color: Theme.of(context).primaryColor,
          ),
        );
      } else {
        return const Icon(
          Icons.circle_outlined,
          color: Colors.white,
        );
      }
    }

    Widget buildImage() {
      final image = SizedBox(
        width: 300,
        height: 300,
        child: Hero(
          tag: asset.id + heroOffset,
          child: ImmichImage(
            asset,
            useGrayBoxPlaceholder: useGrayBoxPlaceholder,
            fit: BoxFit.cover,
          ),
        ),
      );
      if (!multiselectEnabled || !isSelected) {
        return image;
      }
      return Container(
        decoration: BoxDecoration(
          border: Border.all(
            width: 0,
            color: assetContainerColor,
          ),
          color: assetContainerColor,
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topRight: Radius.circular(15.0),
            bottomRight: Radius.circular(15.0),
            bottomLeft: Radius.circular(15.0),
            topLeft: Radius.zero,
          ),
          child: image,
        ),
      );
    }

    return GestureDetector(
      onTap: () {
        if (multiselectEnabled) {
          if (isSelected) {
            onDeselect?.call();
          } else {
            onSelect?.call();
          }
        } else {
          AutoRouter.of(context).push(
            GalleryViewerRoute(
              initialIndex: index,
              loadAsset: loadAsset,
              totalAssets: totalAssets,
              heroOffset: heroOffset,
            ),
          );
        }
      },
      onLongPress: () {
        onSelect?.call();
        HapticFeedback.heavyImpact();
      },
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              border: multiselectEnabled && isSelected
                  ? Border.all(
                      color: onDeselect == null
                          ? Colors.grey
                          : assetContainerColor,
                      width: 8,
                    )
                  : const Border(),
            ),
            child: buildImage(),
          ),
          if (multiselectEnabled)
            Padding(
              padding: const EdgeInsets.all(3.0),
              child: Align(
                alignment: Alignment.topLeft,
                child: buildSelectionIcon(asset),
              ),
            ),
          if (showStorageIndicator)
            Positioned(
              right: 10,
              bottom: 5,
              child: Icon(
                storageIcon(asset),
                color: Colors.white,
                size: 18,
              ),
            ),
          if (asset.isFavorite)
            const Positioned(
              left: 10,
              bottom: 5,
              child: Icon(
                Icons.favorite,
                color: Colors.white,
                size: 18,
              ),
            ),
          if (!asset.isImage)
            Positioned(
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
            ),
        ],
      ),
    );
  }
}
