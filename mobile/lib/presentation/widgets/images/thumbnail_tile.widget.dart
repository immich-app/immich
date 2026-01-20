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
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class ThumbnailTile extends ConsumerStatefulWidget {
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
  ConsumerState<ThumbnailTile> createState() => _ThumbnailTileState();
}

class _ThumbnailTileState extends ConsumerState<ThumbnailTile> {
  bool _hideIndicators = false;
  bool _showSelectionContainer = false;

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    final heroIndex = widget.heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;

    final assetContainerColor = context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.4)
        : context.primaryColor.lighten(amount: 0.75);

    final isSelected = ref.watch(
      multiSelectProvider.select((multiselect) => multiselect.selectedAssets.contains(asset)),
    );

    final bool storageIndicator =
        ref.watch(settingsProvider.select((s) => s.get(Setting.showStorageIndicator))) && widget.showStorageIndicator;

    if (isSelected) {
      _showSelectionContainer = true;
    }

    final uploadProgress = asset is LocalAsset
        ? ref.watch(assetUploadProgressProvider.select((map) => map[asset.id]))
        : null;

    return Stack(
      children: [
        Container(
          color: widget.lockSelection
              ? context.colorScheme.surfaceContainerHighest
              : _showSelectionContainer
              ? assetContainerColor
              : Colors.transparent,
        ),
        AnimatedContainer(
          duration: Durations.short4,
          curve: Curves.decelerate,
          onEnd: () {
            if (!isSelected) {
              _showSelectionContainer = false;
            }
          },
          padding: EdgeInsets.all(isSelected || widget.lockSelection ? 6 : 0),
          child: TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0.0, end: (isSelected || widget.lockSelection) ? 15.0 : 0.0),
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
                    child: Thumbnail.fromAsset(asset: asset, size: widget.size),
                    // Placeholderbuilder used to hide indicators on first hero animation, since flightShuttleBuilder isn't called until both source and destination hero exist in widget tree.
                    placeholderBuilder: (context, heroSize, child) {
                      if (!_hideIndicators) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          setState(() => _hideIndicators = true);
                        });
                      }
                      return const SizedBox();
                    },
                    flightShuttleBuilder: (context, animation, direction, from, to) {
                      void animationStatusListener(AnimationStatus status) {
                        final heroInFlight = status == AnimationStatus.forward || status == AnimationStatus.reverse;
                        if (_hideIndicators != heroInFlight) {
                          setState(() => _hideIndicators = heroInFlight);
                        }
                        if (status == AnimationStatus.completed || status == AnimationStatus.dismissed) {
                          animation.removeStatusListener(animationStatusListener);
                        }
                      }

                      animation.addStatusListener(animationStatusListener);
                      return to.widget;
                    },
                  ),
                ),
                if (asset != null)
                  AnimatedOpacity(
                    opacity: _hideIndicators ? 0.0 : 1.0,
                    duration: Durations.short4,
                    child: Align(
                      alignment: Alignment.topRight,
                      child: _AssetTypeIcons(asset: asset),
                    ),
                  ),
                if (storageIndicator && asset != null)
                  AnimatedOpacity(
                    opacity: _hideIndicators ? 0.0 : 1.0,
                    duration: Durations.short4,
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
                  AnimatedOpacity(
                    duration: Durations.short4,
                    opacity: _hideIndicators ? 0.0 : 1.0,
                    child: const Align(
                      alignment: Alignment.bottomLeft,
                      child: Padding(
                        padding: EdgeInsets.only(left: 10.0, bottom: 6.0),
                        child: _TileOverlayIcon(Icons.favorite_rounded),
                      ),
                    ),
                  ),
                if (uploadProgress != null) _UploadProgressOverlay(progress: uploadProgress),
              ],
            ),
          ),
        ),
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.0, end: (isSelected || widget.lockSelection) ? 1.0 : 0.0),
          duration: Durations.short4,
          curve: Curves.decelerate,
          builder: (context, value, child) {
            return Padding(
              padding: EdgeInsets.all((isSelected || widget.lockSelection) ? value * 3.0 : 3.0),
              child: Align(
                alignment: Alignment.topLeft,
                child: Opacity(
                  opacity: (isSelected || widget.lockSelection) ? 1 : value,
                  child: _SelectionIndicator(
                    isLocked: widget.lockSelection,
                    color: widget.lockSelection ? context.colorScheme.surfaceContainerHighest : assetContainerColor,
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

class _UploadProgressOverlay extends StatelessWidget {
  final double progress;

  const _UploadProgressOverlay({required this.progress});

  @override
  Widget build(BuildContext context) {
    final isError = progress < 0;
    final percentage = isError ? 0 : (progress * 100).toInt();

    return Positioned.fill(
      child: Container(
        color: isError ? Colors.red.withValues(alpha: 0.6) : Colors.black54,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isError)
                const Icon(Icons.error_outline, color: Colors.white, size: 36)
              else
                SizedBox(
                  width: 36,
                  height: 36,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 3,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              const SizedBox(height: 4),
              Text(
                isError ? 'Error' : '$percentage%',
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
