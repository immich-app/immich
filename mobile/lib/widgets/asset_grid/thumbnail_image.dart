import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';
import 'package:immich_mobile/utils/storage_indicator.dart';

class ThumbnailImage extends ConsumerWidget {
  /// The asset to show the thumbnail image for
  final Asset asset;

  /// Whether to show the storage indicator icont over the image or not
  final bool showStorageIndicator;

  /// Whether to show the show stack icon over the image or not
  final bool showStack;

  /// Whether to show the checkmark indicating that this image is selected
  final bool isSelected;

  /// Can override [isSelected] and never show the selection indicator
  final bool multiselectEnabled;

  /// If we are allowed to deselect this image
  final bool canDeselect;

  /// The offset index to apply to this hero tag for animation
  final int heroOffset;

  const ThumbnailImage({
    super.key,
    required this.asset,
    this.showStorageIndicator = true,
    this.showStack = false,
    this.isSelected = false,
    this.multiselectEnabled = false,
    this.heroOffset = 0,
    this.canDeselect = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.6)
        : context.primaryColor.lighten(amount: 0.8);
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isFromDto = asset.id == noDbId;

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
          tag: isFromDto
              ? '${asset.remoteId}-$heroOffset'
              : asset.id + heroOffset,
          child: ImmichThumbnail(
            asset: asset,
            height: 250,
            width: 250,
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

    return Stack(
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
              color: Colors.white.withOpacity(.8),
              size: 16,
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
        if (asset.stackCount > 0) buildStackIcon(),
      ],
    );
  }
}
