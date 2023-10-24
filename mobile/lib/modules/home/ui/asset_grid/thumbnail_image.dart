import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/storage_indicator.dart';
import 'package:isar/isar.dart';

class ThumbnailImage extends StatelessWidget {
  final Asset asset;
  final int index;
  final Asset Function(int index) loadAsset;
  final int totalAssets;
  final bool showStorageIndicator;
  final bool showStack;
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
    this.showStack = false,
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
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isFromResponse = asset.id == Isar.autoIncrement;

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

    Widget buildVideoIcon() {
      final minutes = asset.duration.inMinutes;
      final durationString = asset.duration.toString();
      return Positioned(
        top: 5,
        right: 5,
        child: Row(
          children: [
            Text(
              minutes > 59
                  ? durationString.substring(0, 7) // h:mm:ss
                  : minutes > 0
                      ? durationString.substring(2, 7) // mm:ss
                      : durationString.substring(3, 7), // m:ss
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(
              width: 3,
            ),
            const Icon(
              Icons.play_circle_fill_rounded,
              color: Colors.white,
              size: 18,
            ),
          ],
        ),
      );
    }

    Widget buildStackIcon() {
      return Positioned(
        top: 5,
        right: 5,
        child: Row(
          children: [
            if (asset.stackCount > 1)
              Text(
                "${asset.stackCount}",
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            if (asset.stackCount > 1)
              const SizedBox(
                width: 3,
              ),
            const Icon(
              Icons.burst_mode_rounded,
              color: Colors.white,
              size: 18,
            ),
          ],
        ),
      );
    }

    Widget buildImage() {
      final image = SizedBox(
        width: 300,
        height: 300,
        child: Hero(
          tag: isFromResponse
              ? '${asset.remoteId}-$heroOffset'
              : asset.id + heroOffset,
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
            color: onDeselect == null ? Colors.grey : assetContainerColor,
          ),
          color: onDeselect == null ? Colors.grey : assetContainerColor,
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
              showStack: showStack,
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
          if (!asset.isImage) buildVideoIcon(),
          if (asset.isImage && asset.stackCount > 0) buildStackIcon(),
        ],
      ),
    );
  }
}
