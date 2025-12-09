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
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'dart:async';

class _DelayedAnimation extends StatefulWidget {
  final Widget child;
  final bool show;
  final Duration showDelay;
  final Duration hideDelay;
  final Duration showDuration;
  final Duration hideDuration;

  const _DelayedAnimation({
    required this.child,
    required this.show,
    this.showDelay = const Duration(milliseconds: 0),
    this.hideDelay = const Duration(milliseconds: 0),
    this.showDuration = const Duration(milliseconds: 0),
    this.hideDuration = const Duration(milliseconds: 0),
  });

  @override
  State<_DelayedAnimation> createState() => _DelayedAnimationState();
}

class _DelayedAnimationState extends State<_DelayedAnimation> {
  bool _show = false;
  Duration _currentDuration = const Duration(milliseconds: 200);
  Timer? _delayTimer;

  @override
  void initState() {
    super.initState();
    // If starting with show=true, show immediately (no delay on initial render)
    if (widget.show) {
      _show = true;
      _currentDuration = widget.showDuration;
    }
  }

  @override
  void didUpdateWidget(_DelayedAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Cancel any pending timer
    _delayTimer?.cancel();

    if (widget.show && !oldWidget.show) {
      // Showing: set duration, then delay, then show
      _currentDuration = widget.showDuration;
      if (widget.showDelay == Duration.zero) {
        setState(() => _show = true);
      } else {
        _delayTimer = Timer(widget.showDelay, () {
          if (mounted) {
            setState(() => _show = true);
          }
        });
      }
    } else if (!widget.show && oldWidget.show) {
      // Hiding: delay, then set duration and hide
      if (widget.hideDelay == Duration.zero) {
        setState(() {
          _currentDuration = widget.hideDuration;
          _show = false;
        });
      } else {
        _delayTimer = Timer(widget.hideDelay, () {
          if (mounted) {
            setState(() {
              _currentDuration = widget.hideDuration;
              _show = false;
            });
          }
        });
      }
    }
  }

  @override
  void dispose() {
    _delayTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(duration: _currentDuration, opacity: _show ? 1.0 : 0.0, child: widget.child);
  }
}

class ThumbnailTile extends ConsumerWidget {
  const ThumbnailTile(
    this.asset, {
    this.size = kThumbnailResolution,
    this.fit = BoxFit.cover,
    this.showStorageIndicator = false,
    this.lockSelection = false,
    this.heroOffset,
    super.key,
  });

  final BaseAsset? asset;
  final Size size;
  final BoxFit fit;
  final bool showStorageIndicator;
  final bool lockSelection;
  final int? heroOffset;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = this.asset;
    final heroIndex = heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
    final currentAsset = ref.watch(currentAssetNotifier);
    final showIndicators = asset == null || asset != currentAsset;

    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.4)
        : context.primaryColor.lighten(amount: 0.75);

    final isSelected = ref.watch(
      multiSelectProvider.select((multiselect) => multiselect.selectedAssets.contains(asset)),
    );

    final bool storageIndicator =
        ref.watch(settingsProvider.select((s) => s.get(Setting.showStorageIndicator))) && showStorageIndicator;

    return Stack(
      children: [
        _DelayedAnimation(
          show: isSelected || lockSelection,
          hideDelay: Durations.short4,
          child: Container(color: lockSelection ? context.colorScheme.surfaceContainerHighest : assetContainerColor),
        ),
        AnimatedContainer(
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
                  _DelayedAnimation(
                    show: showIndicators,
                    showDelay: const Duration(milliseconds: 300),
                    showDuration: const Duration(milliseconds: 200),
                    hideDuration: const Duration(milliseconds: 150),
                    child: Align(
                      alignment: Alignment.topRight,
                      child: _AssetTypeIcons(asset: asset),
                    ),
                  ),

                if (storageIndicator && asset != null)
                  _DelayedAnimation(
                    show: showIndicators,
                    showDelay: const Duration(milliseconds: 300),
                    showDuration: const Duration(milliseconds: 200),
                    hideDuration: const Duration(milliseconds: 150),
                    child: switch (asset.storage) {
                      AssetState.local => const Align(
                        alignment: Alignment.bottomRight,
                        child: Padding(
                          padding: EdgeInsets.only(right: 10.0, bottom: 6.0),
                          child: _TileOverlayIcon(Icons.cloud_off_outlined),
                        ),
                      ),
                      AssetState.remote => const Align(
                        alignment: Alignment.bottomRight,
                        child: Padding(
                          padding: EdgeInsets.only(right: 10.0, bottom: 6.0),
                          child: _TileOverlayIcon(Icons.cloud_outlined),
                        ),
                      ),
                      AssetState.merged => const Align(
                        alignment: Alignment.bottomRight,
                        child: Padding(
                          padding: EdgeInsets.only(right: 10.0, bottom: 6.0),
                          child: _TileOverlayIcon(Icons.cloud_done_outlined),
                        ),
                      ),
                    },
                  ),

                if (asset != null && asset.isFavorite)
                  _DelayedAnimation(
                    show: showIndicators,
                    showDelay: const Duration(milliseconds: 300),
                    showDuration: const Duration(milliseconds: 200),
                    hideDuration: const Duration(milliseconds: 150),
                    child: const Align(
                      alignment: Alignment.bottomLeft,
                      child: Padding(
                        padding: EdgeInsets.only(left: 10.0, bottom: 6.0),
                        child: _TileOverlayIcon(Icons.favorite_rounded),
                      ),
                    ),
                  ),
              ],
            ),
          ),
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
  const _VideoIndicator(this.duration);

  @override
  Widget build(BuildContext context) {
    return Row(
      spacing: 3,
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.end,
      // CrossAxisAlignment.start looks more centered vertically than CrossAxisAlignment.center
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          duration.format(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            shadows: [Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6))],
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
      shadows: [const Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6), offset: Offset(0.0, 0.0))],
    );
  }
}

class _AssetTypeIcons extends StatelessWidget {
  final BaseAsset asset;

  const _AssetTypeIcons({required this.asset});

  @override
  Widget build(BuildContext context) {
    final hasStack = asset is RemoteAsset && (asset as RemoteAsset).stackId != null;
    final isLivePhoto = asset is RemoteAsset && asset.livePhotoVideoId != null;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (asset.isVideo)
          Padding(padding: const EdgeInsets.only(right: 10.0, top: 6.0), child: _VideoIndicator(asset.duration)),
        if (hasStack)
          const Padding(
            padding: EdgeInsets.only(right: 10.0, top: 6.0),
            child: _TileOverlayIcon(Icons.burst_mode_rounded),
          ),
        if (isLivePhoto)
          const Padding(
            padding: EdgeInsets.only(right: 10.0, top: 6.0),
            child: _TileOverlayIcon(Icons.motion_photos_on_rounded),
          ),
      ],
    );
  }
}
