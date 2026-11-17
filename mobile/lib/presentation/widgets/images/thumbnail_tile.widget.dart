import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class ThumbnailTile extends ConsumerStatefulWidget {
  const ThumbnailTile(
    this.asset, {
    this.size = kThumbnailResolution,
    this.remoteSize,
    this.showStorageIndicator = false,
    this.lockSelection = false,
    this.heroOffset,
    this.showStackIndicator = false,
    super.key,
  });

  final BaseAsset? asset;
  final Size size;

  /// Physical size to decode for remote thumbnails.
  final Size? remoteSize;
  final bool showStorageIndicator;
  final bool lockSelection;
  final int? heroOffset;
  final bool showStackIndicator;

  @override
  ConsumerState<ThumbnailTile> createState() => _ThumbnailTileState();
}

class _ThumbnailTileState extends ConsumerState<ThumbnailTile> with TickerProviderStateMixin {
  late final _selection = _Transition(this, Curves.decelerate);
  late final _indicators = _Transition(this, Curves.linear);
  bool _hideIndicators = false;

  @override
  void dispose() {
    _selection.dispose();
    _indicators.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    final heroIndex = widget.heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
    final isCurrentAsset = ref.watch(assetViewerProvider.select((current) => current.currentAsset == asset));
    final isSelected =
        widget.lockSelection ||
        ref.watch(multiSelectProvider.select((multiselect) => multiselect.selectedAssets.contains(asset)));
    final storageIndicator =
        widget.showStorageIndicator && ref.watch(appConfigProvider.select((s) => s.timeline.storageIndicator));
    final uploadProgress = asset is LocalAsset
        ? ref.watch(assetUploadProgressProvider.select((map) => map[asset.id]))
        : null;

    if (!isCurrentAsset) {
      _hideIndicators = false;
    }

    final selection = _selection.toward(isSelected);
    final indicators = _indicators.toward(!_hideIndicators);
    final hasSelection = selection != kAlwaysDismissedAnimation;
    final selectionColor = !hasSelection
        ? Colors.transparent
        : widget.lockSelection
        ? context.colorScheme.surfaceContainerHighest
        : context.isDarkTheme
        ? context.primaryColor.darken(amount: 0.4)
        : context.primaryColor.lighten(amount: 0.75);

    final overlays = asset == null ? const <Widget>[] : _overlays(asset, storageIndicator);

    return Stack(
      children: [
        _SelectionFrame(
          selection: selection,
          color: selectionColor,
          child: Stack(
            children: [
              Positioned.fill(
                child: Hero(
                  // This key resets the hero animation when the asset is changed in the asset viewer.
                  // It doesn't seem like the best solution, and only works to reset the hero, not prime the hero of the new active asset for animation,
                  // but other solutions have failed thus far.
                  key: ValueKey(isCurrentAsset),
                  tag: '${asset?.heroTag}_$heroIndex',
                  child: Thumbnail.fromAsset(asset: asset, size: widget.size, remoteSize: widget.remoteSize),
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
                      if (!mounted) {
                        return;
                      }
                      final heroInFlight = status == AnimationStatus.forward || status == AnimationStatus.reverse;
                      if (_hideIndicators != heroInFlight) {
                        setState(() => _hideIndicators = heroInFlight);
                      }
                      if (status == AnimationStatus.completed || status == AnimationStatus.dismissed) {
                        animation.removeStatusListener(animationStatusListener);
                      }
                    }

                    animation.addStatusListener(animationStatusListener);
                    return direction == HeroFlightDirection.push ? from.widget : to.widget;
                  },
                ),
              ),
              if (overlays.isNotEmpty)
                FadeTransition(
                  opacity: indicators,
                  child: Stack(children: overlays),
                ),
              if (uploadProgress != null) _UploadProgressOverlay(progress: uploadProgress),
            ],
          ),
        ),
        if (hasSelection)
          AnimatedBuilder(
            animation: selection,
            builder: (context, child) => Padding(
              padding: EdgeInsets.all(isSelected ? selection.value * 3 : 3),
              child: Align(
                alignment: Alignment.topLeft,
                child: Opacity(opacity: isSelected ? 1 : selection.value, child: child),
              ),
            ),
            child: _SelectionIndicator(isLocked: widget.lockSelection, color: selectionColor),
          ),
      ],
    );
  }

  List<Widget> _overlays(BaseAsset asset, bool storageIndicator) {
    final typeIcons = [
      if (asset.isVideo) _VideoIndicator(asset.duration),
      if (asset.isMotionPhoto) const _TileOverlayIcon(Icons.motion_photos_on_rounded),
      if (asset.isAnimatedImage) const _TileOverlayIcon(Icons.gif_rounded),
      if (widget.showStackIndicator && asset is RemoteAsset && asset.stackId != null)
        const _TileOverlayIcon(Icons.burst_mode_rounded),
    ];
    return [
      if (typeIcons.isNotEmpty)
        Positioned(
          top: 6,
          right: 10,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            spacing: 6,
            children: typeIcons,
          ),
        ),
      if (storageIndicator)
        switch (asset.storage) {
          AssetState.local => const Positioned(right: 10, bottom: 6, child: _TileOverlayIcon(Icons.cloud_off_outlined)),
          AssetState.remote => const Positioned(right: 10, bottom: 6, child: _TileOverlayIcon(Icons.cloud_outlined)),
          AssetState.merged => const Positioned(
            right: 10,
            bottom: 6,
            child: _TileOverlayIcon(Icons.cloud_done_outlined),
          ),
        },
      if (asset.isFavorite) const Positioned(left: 10, bottom: 6, child: _TileOverlayIcon(Icons.favorite_rounded)),
    ];
  }
}

class _Transition {
  _Transition(this._vsync, this._curve);

  final TickerProvider _vsync;
  final Curve _curve;
  bool? _target;
  AnimationController? _controller;

  Animation<double> toward(bool target) {
    final previous = _target;
    _target = target;
    if (previous != null && previous != target) {
      final controller = _controller ??= AnimationController(vsync: _vsync, value: previous ? 1 : 0);
      unawaited(controller.animateTo(target ? 1 : 0, duration: Durations.short4, curve: _curve));
    }
    return _controller ?? (target ? kAlwaysCompleteAnimation : kAlwaysDismissedAnimation);
  }

  void dispose() => _controller?.dispose();
}

class _SelectionFrame extends SingleChildRenderObjectWidget {
  final Animation<double> selection;
  final Color color;

  const _SelectionFrame({required this.selection, required this.color, required super.child});

  @override
  RenderObject createRenderObject(BuildContext context) => _RenderSelectionFrame(selection, color);

  @override
  void updateRenderObject(BuildContext context, _RenderSelectionFrame renderObject) {
    renderObject
      ..selection = selection
      ..color = color;
  }
}

class _RenderSelectionFrame extends RenderShiftedBox {
  Animation<double> _selection;
  Color _color;

  _RenderSelectionFrame(this._selection, this._color) : super(null);

  set selection(Animation<double> value) {
    if (_selection == value) {
      return;
    }
    if (attached) {
      _selection.removeListener(markNeedsLayout);
      value.addListener(markNeedsLayout);
    }
    _selection = value;
    markNeedsLayout();
  }

  set color(Color value) {
    if (_color != value) {
      _color = value;
      markNeedsPaint();
    }
  }

  @override
  void attach(PipelineOwner owner) {
    super.attach(owner);
    _selection.addListener(markNeedsLayout);
  }

  @override
  void detach() {
    _selection.removeListener(markNeedsLayout);
    super.detach();
  }

  @override
  bool hitTestSelf(Offset position) => true;

  @override
  void performLayout() {
    size = constraints.biggest;
    final inset = 6 * _selection.value;
    final child = this.child!;
    child.layout(BoxConstraints.tight(Size(size.width - 2 * inset, size.height - 2 * inset)));
    (child.parentData! as BoxParentData).offset = Offset(inset, inset);
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final selection = _selection.value;
    if (selection == 0) {
      layer = null;
      super.paint(context, offset);
      return;
    }
    context.canvas.drawRect(offset & size, Paint()..color = _color);
    final content = (Offset.zero & size).deflate(6 * selection);
    layer = context.pushClipRRect(
      needsCompositing,
      offset,
      content,
      RRect.fromRectAndRadius(content, Radius.circular(15 * selection)),
      super.paint,
      oldLayer: layer as ClipRRectLayer?,
    );
  }
}

class _SelectionIndicator extends StatelessWidget {
  final bool isLocked;
  final Color color;

  const _SelectionIndicator({required this.isLocked, required this.color});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
      child: isLocked
          ? const Icon(Icons.check_circle_rounded, color: Colors.grey)
          : Icon(Icons.check_circle_rounded, color: context.primaryColor),
    );
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
      shadows: const [Shadow(blurRadius: 5.0, color: Color.fromRGBO(0, 0, 0, 0.6), offset: Offset.zero)],
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
      child: ColoredBox(
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
