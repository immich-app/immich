import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

class ThumbnailImage extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.6)
        : context.primaryColor.lighten(amount: 0.8);

    return Stack(
      children: [
        Container(color: canDeselect ? assetContainerColor : Colors.grey),
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.decelerate,
          padding: EdgeInsets.all(multiselectEnabled && isSelected ? 8 : 0),
          child: Stack(
            children: [
              _ImageIcon(
                heroOffset: heroOffset,
                asset: asset,
                assetContainerColor: assetContainerColor,
                multiselectEnabled: multiselectEnabled,
                canDeselect: canDeselect,
                isSelected: isSelected,
              ),
              if (showStorageIndicator) _StorageIcon(storage: asset.storage),
              if (asset.isFavorite)
                const Positioned(left: 8, bottom: 5, child: Icon(Icons.favorite, color: Colors.white, size: 16)),
              if (asset.isVideo) _VideoIcon(duration: asset.duration),
              if (asset.stackCount > 0) _StackIcon(isVideo: asset.isVideo, stackCount: asset.stackCount),
            ],
          ),
        ),
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.0, end: multiselectEnabled ? 1.0 : 0.0),
          duration: const Duration(milliseconds: 300),
          curve: Curves.decelerate,
          builder: (context, value, child) {
            final double outlineCircleScale = 0.6 + (0.4 * value);
            return Padding(
              padding: EdgeInsets.all(isSelected ? value * 3.0 : 3.0),
              child: Align(
                alignment: Alignment.topLeft,
                child: Opacity(
                  opacity: isSelected ? 1 : value,
                  child: Transform.scale(
                    scale: isSelected ? value : outlineCircleScale,
                    alignment: isSelected ? Alignment.topLeft : Alignment.center,
                    child: isSelected
                        ? const _SelectedIcon()
                        : Icon(Icons.circle_outlined, color: Colors.white.withValues(alpha: 0.8)),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _SelectedIcon extends StatelessWidget {
  const _SelectedIcon();

  @override
  Widget build(BuildContext context) {
    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.6)
        : context.primaryColor.lighten(amount: 0.8);

    return DecoratedBox(
      decoration: BoxDecoration(shape: BoxShape.circle, color: assetContainerColor),
      child: Icon(Icons.check_circle_rounded, color: context.primaryColor),
    );
  }
}

class _VideoIcon extends StatelessWidget {
  final Duration duration;

  const _VideoIcon({required this.duration});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 5,
      right: 8,
      child: Row(
        children: [
          Text(
            duration.format(),
            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 3),
          const Icon(Icons.play_circle_fill_rounded, color: Colors.white, size: 18),
        ],
      ),
    );
  }
}

class _StackIcon extends StatelessWidget {
  final bool isVideo;
  final int stackCount;

  const _StackIcon({required this.isVideo, required this.stackCount});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: isVideo ? 28 : 5,
      right: 8,
      child: Row(
        children: [
          if (stackCount > 1)
            Text(
              "$stackCount",
              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          if (stackCount > 1) const SizedBox(width: 3),
          const Icon(Icons.burst_mode_rounded, color: Colors.white, size: 18),
        ],
      ),
    );
  }
}

class _StorageIcon extends StatelessWidget {
  final AssetState storage;

  const _StorageIcon({required this.storage});

  @override
  Widget build(BuildContext context) {
    return switch (storage) {
      AssetState.local => const Positioned(
        right: 8,
        bottom: 5,
        child: Icon(
          Icons.cloud_off_outlined,
          color: Color.fromRGBO(255, 255, 255, 0.8),
          size: 16,
          shadows: [Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6), offset: Offset(0.0, 0.0))],
        ),
      ),
      AssetState.remote => const Positioned(
        right: 8,
        bottom: 5,
        child: Icon(
          Icons.cloud_outlined,
          color: Color.fromRGBO(255, 255, 255, 0.8),
          size: 16,
          shadows: [Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6), offset: Offset(0.0, 0.0))],
        ),
      ),
      AssetState.merged => const Positioned(
        right: 8,
        bottom: 5,
        child: Icon(
          Icons.cloud_done_outlined,
          color: Color.fromRGBO(255, 255, 255, 0.8),
          size: 16,
          shadows: [Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6), offset: Offset(0.0, 0.0))],
        ),
      ),
    };
  }
}

class _ImageIcon extends StatelessWidget {
  final int heroOffset;
  final Asset asset;
  final Color assetContainerColor;
  final bool multiselectEnabled;
  final bool canDeselect;
  final bool isSelected;

  const _ImageIcon({
    required this.heroOffset,
    required this.asset,
    required this.assetContainerColor,
    required this.multiselectEnabled,
    required this.canDeselect,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isDto = asset.id == noDbId;
    final image = SizedBox.expand(
      child: Hero(
        tag: isDto ? '${asset.remoteId}-$heroOffset' : asset.id + heroOffset,
        child: Stack(
          children: [
            SizedBox.expand(child: ImmichThumbnail(asset: asset, height: 250, width: 250)),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color.fromRGBO(0, 0, 0, 0.1),
                    Colors.transparent,
                    Colors.transparent,
                    Color.fromRGBO(0, 0, 0, 0.1),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: [0, 0.3, 0.6, 1],
                ),
              ),
            ),
          ],
        ),
      ),
    );

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: (multiselectEnabled && isSelected) ? 15.0 : 0.0),
      duration: const Duration(milliseconds: 300),
      curve: Curves.decelerate,
      builder: (context, value, child) {
        return ClipRRect(borderRadius: BorderRadius.all(Radius.circular(value)), child: child);
      },
      child: image,
    );
  }
}
