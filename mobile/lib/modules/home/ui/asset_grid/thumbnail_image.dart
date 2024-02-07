import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/utils/storage_indicator.dart';
import 'package:isar/isar.dart';

class ThumbnailImage extends StatelessWidget {
  final Asset asset;
  final bool showStorageIndicator;
  final bool showStack;
  final bool isSelected;
  final bool multiselectEnabled;
  final bool canDeselect;
  final int heroOffset;
  final Function()? onTap;
  final Function()? onLongPress;

  const ThumbnailImage({
    super.key,
    required this.asset,
    this.showStorageIndicator = true,
    this.showStack = false,
    this.isSelected = false,
    this.multiselectEnabled = false,
    this.heroOffset = 0,
    this.canDeselect = true,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final assetContainerColor = context.isDarkTheme
        ? Colors.blueGrey
        : context.themeData.primaryColorLight;
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isFromDto = asset.id == Isar.autoIncrement;

    Widget buildSelectionIcon(Asset asset) {
      if (isSelected) {
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: assetContainerColor,
          ),
          child: Icon(
            Icons.check_circle_rounded,
            color: context.primaryColor,
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
        right: 8,
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
        top: !asset.isImage ? 28 : 5,
        right: 8,
        child: Row(
          children: [
            if (asset.stackChildrenCount > 1)
              Text(
                "${asset.stackChildrenCount}",
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            if (asset.stackChildrenCount > 1)
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
          tag: isFromDto
              ? '${asset.remoteId}-$heroOffset'
              : asset.id + heroOffset,
          child: ImmichImage.thumbnail(
            asset,
            height: 300,
            width: 300,
          ),
        ),
      );
      if (!multiselectEnabled || !isSelected) {
        return image;
      }
      return Container(
        decoration: BoxDecoration(
          color: canDeselect ? assetContainerColor : Colors.grey,
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
      onTap: onTap,
      onLongPress: onLongPress,
      child: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            curve: Curves.decelerate,
            decoration: BoxDecoration(
              border: multiselectEnabled && isSelected
                  ? Border.all(
                      color: canDeselect ? assetContainerColor : Colors.grey,
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
              right: 8,
              bottom: 5,
              child: Icon(
                storageIcon(asset),
                color: Colors.white,
                size: 18,
              ),
            ),
          if (asset.isFavorite)
            const Positioned(
              left: 8,
              bottom: 5,
              child: Icon(
                Icons.favorite,
                color: Colors.white,
                size: 18,
              ),
            ),
          if (!asset.isImage) buildVideoIcon(),
          if (asset.stackChildrenCount > 0) buildStackIcon(),
        ],
      ),
    );
  }
}
