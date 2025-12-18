import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class ThumbnailTile extends ConsumerWidget {
  const ThumbnailTile(
    this.asset, {
    this.size = kThumbnailResolution,
    this.fit = BoxFit.cover,
    this.showStorageIndicator = false,
    this.lockSelection = false,
    this.heroOffset,
    this.ownerName,
    super.key,
  });

  final BaseAsset? asset;
  final Size size;
  final BoxFit fit;
  final bool showStorageIndicator;
  final bool lockSelection;
  final int? heroOffset;
  final String? ownerName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    final heroIndex = heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;

    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.4)
        : context.primaryColor.lighten(amount: 0.75);

    final isSelected = ref.watch(
      multiSelectProvider.select((multiselect) => multiselect.selectedAssets.contains(asset)),
    );

    final bool storageIndicator =
        ref.watch(settingsProvider.select((s) => s.get(Setting.showStorageIndicator))) && showStorageIndicator;

    final bool showOwnerNameSetting = ref.watch(settingsProvider.select((s) => s.get(Setting.showOwnerName)));
    final shouldShowOwnerName = showOwnerNameSetting && ownerName != null;

    return Stack(
      children: [
        Container(color: lockSelection ? context.colorScheme.surfaceContainerHighest : assetContainerColor),
        LayoutBuilder(
          builder: (context, constraints) {
            final metrics = _OverlayMetrics.fromConstraints(constraints);

            return AnimatedContainer(
              duration: Durations.short4,
              curve: Curves.decelerate,
              padding: EdgeInsets.all(isSelected || lockSelection ? 6 : 0),
              child: TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0.0, end: (isSelected || lockSelection) ? 15.0 : 0.0),
                duration: Durations.short4,
                curve: Curves.decelerate,
                builder: (context, value, child) {
                  return ClipRRect(borderRadius: BorderRadius.all(Radius.circular(value)), child: child);
                },
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: Hero(
                        tag: '${asset?.heroTag ?? ''}_$heroIndex',
                        child: Thumbnail.fromAsset(asset: asset, size: size),
                      ),
                    ),
                    if (asset != null)
                      Align(
                        alignment: Alignment.topRight,
                        child: Padding(
                          padding: EdgeInsets.symmetric(horizontal: metrics.padding, vertical: metrics.padding),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [_AssetTypeIcons(asset: asset, metrics: metrics)],
                          ),
                        ),
                      ),
                    if (shouldShowOwnerName ||
                        (storageIndicator && asset != null) ||
                        (asset != null && asset.isFavorite))
                      Align(
                        alignment: Alignment.bottomCenter,
                        child: Padding(
                          padding: EdgeInsets.symmetric(horizontal: metrics.padding, vertical: metrics.padding),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              if (asset != null && asset.isFavorite)
                                Padding(
                                  padding: EdgeInsets.only(right: metrics.iconSpacing),
                                  child: _TileOverlayIcon(Icons.favorite_rounded, metrics: metrics),
                                )
                              else
                                const SizedBox.shrink(),
                              if (shouldShowOwnerName)
                                Flexible(
                                  child: Padding(
                                    padding: EdgeInsets.symmetric(horizontal: metrics.iconSpacing),
                                    child: _OwnerNameLabel(ownerName: ownerName!, metrics: metrics),
                                  ),
                                ),
                              if (storageIndicator && asset != null)
                                Padding(
                                  padding: EdgeInsets.only(right: metrics.iconSpacing),
                                  child: _TileOverlayIcon(switch (asset.storage) {
                                    AssetState.local => Icons.cloud_off_outlined,
                                    AssetState.remote => Icons.cloud_outlined,
                                    AssetState.merged => Icons.cloud_done_outlined,
                                  }, metrics: metrics),
                                ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.0, end: (isSelected || lockSelection) ? 1.0 : 0.0),
          duration: Durations.short4,
          curve: Curves.decelerate,
          builder: (context, value, child) {
            return Padding(
              padding: EdgeInsets.all((isSelected || lockSelection) ? value * 3.0 : 3.0),
              child: Align(
                alignment: Alignment.topLeft,
                child: Opacity(
                  opacity: (isSelected || lockSelection) ? 1 : value,
                  child: _SelectionIndicator(
                    isLocked: lockSelection,
                    color: lockSelection ? context.colorScheme.surfaceContainerHighest : assetContainerColor,
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

class _SelectionIndicator extends StatelessWidget {
  final bool isLocked;
  final Color? color;

  const _SelectionIndicator({required this.isLocked, this.color});

  @override
  Widget build(BuildContext context) {
    if (isLocked) {
      return DecoratedBox(
        decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        child: const Icon(Icons.check_circle_rounded, color: Colors.grey),
      );
    } else {
      return DecoratedBox(
        decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        child: Icon(Icons.check_circle_rounded, color: context.primaryColor),
      );
    }
  }
}

class _VideoIndicator extends StatelessWidget {
  final Duration duration;
  final _OverlayMetrics metrics;
  const _VideoIndicator(this.duration, {required this.metrics});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.end,
      // CrossAxisAlignment.start looks more centered vertically than CrossAxisAlignment.center
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          duration.format(),
          style: TextStyle(
            color: Colors.white,
            fontSize: metrics.fontSize,
            fontWeight: FontWeight.bold,
            shadows: [Shadow(blurRadius: metrics.blurRadius, color: const Color.fromRGBO(0, 0, 0, 0.6))],
          ),
        ),
        SizedBox(width: metrics.iconSpacing),
        _TileOverlayIcon(Icons.play_circle_outline_rounded, metrics: metrics),
      ],
    );
  }
}

class _TileOverlayIcon extends StatelessWidget {
  final IconData icon;
  final _OverlayMetrics metrics;

  const _TileOverlayIcon(this.icon, {required this.metrics});

  @override
  Widget build(BuildContext context) {
    return Icon(
      icon,
      color: Colors.white,
      size: metrics.iconSize,
      shadows: [
        Shadow(
          blurRadius: metrics.blurRadius,
          color: const Color.fromRGBO(0, 0, 0, 0.6),
          offset: const Offset(0.0, 0.0),
        ),
      ],
    );
  }
}

class _AssetTypeIcons extends StatelessWidget {
  final BaseAsset asset;
  final _OverlayMetrics metrics;

  const _AssetTypeIcons({required this.asset, required this.metrics});

  @override
  Widget build(BuildContext context) {
    final hasStack = asset is RemoteAsset && (asset as RemoteAsset).stackId != null;
    final isLivePhoto = asset is RemoteAsset && asset.livePhotoVideoId != null;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (asset.isVideo)
          Padding(
            padding: EdgeInsets.only(left: metrics.iconSpacing),
            child: _VideoIndicator(asset.duration, metrics: metrics),
          ),
        if (hasStack)
          Padding(
            padding: EdgeInsets.only(left: metrics.iconSpacing),
            child: _TileOverlayIcon(Icons.burst_mode_rounded, metrics: metrics),
          ),
        if (isLivePhoto)
          Padding(
            padding: EdgeInsets.only(left: metrics.iconSpacing),
            child: _TileOverlayIcon(Icons.motion_photos_on_rounded, metrics: metrics),
          ),
      ],
    );
  }
}

class _OwnerNameLabel extends StatelessWidget {
  final String ownerName;
  final _OverlayMetrics metrics;

  const _OwnerNameLabel({required this.ownerName, required this.metrics});

  @override
  Widget build(BuildContext context) {
    return Text(
      ownerName,
      style: TextStyle(
        color: Colors.white,
        fontSize: metrics.fontSize,
        fontWeight: FontWeight.w500,
        shadows: [
          Shadow(
            blurRadius: metrics.blurRadius,
            color: const Color.fromRGBO(0, 0, 0, 0.6),
            offset: const Offset(0.0, 0.0),
          ),
        ],
      ),
      overflow: TextOverflow.fade,
      softWrap: false,
      maxLines: 1,
    );
  }
}

class _OverlayMetrics {
  final double padding;
  final double iconSize;
  final double fontSize;
  final double iconSpacing;
  final double blurRadius;

  const _OverlayMetrics({
    required this.padding,
    required this.iconSize,
    required this.fontSize,
    required this.iconSpacing,
    required this.blurRadius,
  });

  factory _OverlayMetrics.fromConstraints(BoxConstraints constraints) {
    const baseSize = 120.0;
    final scale = (constraints.maxWidth / baseSize).clamp(0.5, 2.0);

    return _OverlayMetrics(
      padding: (2.0 * scale).clamp(1.0, 4.0),
      iconSize: (16.0 * scale).clamp(14.0, 20.0),
      fontSize: (12.0 * scale).clamp(11.0, 14.0),
      iconSpacing: (2.0 * scale).clamp(1.0, 4.0),
      blurRadius: (5.0 * scale).clamp(3.0, 7.0),
    );
  }
}
