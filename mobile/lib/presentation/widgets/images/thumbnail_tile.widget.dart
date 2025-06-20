import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class ThumbnailTile extends ConsumerWidget {
  const ThumbnailTile(
    this.asset, {
    this.size = const Size.square(256),
    this.fit = BoxFit.cover,
    this.showStorageIndicator = true,
    this.canDeselect = true,
    super.key,
  });

  final BaseAsset asset;
  final Size size;
  final BoxFit fit;
  final bool showStorageIndicator;

  /// If we are allowed to deselect this image
  final bool canDeselect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.6)
        : context.primaryColor.lighten(amount: 0.8);
    final isMultiSelectEnabled =
        ref.watch(multiSelectProvider.select((state) => state.isEnabled));
    final isSelected = ref
        .watch(multiSelectProvider.select((state) => state.selectedAssets))
        .contains(asset);

    return Stack(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.decelerate,
          decoration: BoxDecoration(
            color: isMultiSelectEnabled && isSelected
                ? (canDeselect ? assetContainerColor : Colors.grey)
                : null,
            border: isMultiSelectEnabled && isSelected
                ? Border.all(
                    color: canDeselect ? assetContainerColor : Colors.grey,
                    width: 8,
                  )
                : const Border(),
          ),
          child: ClipRRect(
            borderRadius: isMultiSelectEnabled && isSelected
                ? const BorderRadius.all(Radius.circular(15.0))
                : BorderRadius.zero,
            child: Stack(
              children: [
                Positioned.fill(
                  child: Thumbnail(
                    asset: asset,
                    fit: fit,
                    size: size,
                    isSelected: isSelected,
                  ),
                ),
                if (asset.isVideo)
                  Align(
                    alignment: Alignment.topRight,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10.0, top: 6.0),
                      child: _VideoIndicator(asset.durationInSeconds ?? 0),
                    ),
                  ),
                if (showStorageIndicator)
                  Align(
                    alignment: Alignment.bottomRight,
                    child: Padding(
                      padding: const EdgeInsets.only(right: 10.0, bottom: 6.0),
                      child: _TileOverlayIcon(
                        switch (asset.storage) {
                          AssetState.local => Icons.cloud_off_outlined,
                          AssetState.remote => Icons.cloud_outlined,
                          AssetState.merged => Icons.cloud_done_outlined,
                        },
                      ),
                    ),
                  ),
                if (asset.isFavorite)
                  const Align(
                    alignment: Alignment.bottomLeft,
                    child: Padding(
                      padding: EdgeInsets.only(left: 10.0, bottom: 6.0),
                      child: _TileOverlayIcon(Icons.favorite_rounded),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (isMultiSelectEnabled)
          Padding(
            padding: const EdgeInsets.all(3.0),
            child: Align(
              alignment: Alignment.topLeft,
              child: _SelectionIndicator(isSelected: isSelected),
            ),
          ),
      ],
    );
  }
}

class _SelectionIndicator extends StatelessWidget {
  final bool isSelected;

  const _SelectionIndicator({
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.6)
        : context.primaryColor.lighten(amount: 0.8);

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
}

class _VideoIndicator extends StatelessWidget {
  final int durationInSeconds;
  const _VideoIndicator(this.durationInSeconds);

  String _formatDuration(int durationInSec) {
    final int hours = durationInSec ~/ 3600;
    final int minutes = (durationInSec % 3600) ~/ 60;
    final int seconds = durationInSec % 60;

    final String minutesPadded = minutes.toString().padLeft(2, '0');
    final String secondsPadded = seconds.toString().padLeft(2, '0');

    if (hours > 0) {
      return "$hours:$minutesPadded:$secondsPadded"; // H:MM:SS
    } else {
      return "$minutesPadded:$secondsPadded"; // MM:SS
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      spacing: 3,
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.end,
      // CrossAxisAlignment.end looks more centered vertically than CrossAxisAlignment.center
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          _formatDuration(durationInSeconds),
          style: TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            shadows: [
              Shadow(
                blurRadius: 5.0,
                color: Colors.black.withValues(alpha: 0.6),
              ),
            ],
          ),
        ),
        const _TileOverlayIcon(Icons.play_circle_outline_rounded),
      ],
    );
  }
}

class _TileOverlayIcon extends StatelessWidget {
  final IconData icon;

  const _TileOverlayIcon(this.icon);

  @override
  Widget build(BuildContext context) {
    return Icon(
      icon,
      color: Colors.white,
      size: 16,
      shadows: [
        Shadow(
          blurRadius: 5.0,
          color: Colors.black.withValues(alpha: 0.6),
          offset: const Offset(0.0, 0.0),
        ),
      ],
    );
  }
}
