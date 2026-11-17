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
  bool _hideIndicators = false;

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

    final overlays = asset == null ? const <Widget>[] : _overlays(asset, storageIndicator);

    return _SelectionFrame(
      vsync: this,
      colors: isSelected
          ? (background: _selectionColor, check: widget.lockSelection ? Colors.grey : context.primaryColor)
          : null,
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
            _Fade(
              vsync: this,
              visible: !_hideIndicators,
              child: Stack(children: overlays),
            ),
          if (uploadProgress != null) _UploadProgressOverlay(progress: uploadProgress),
        ],
      ),
    );
  }

  Color get _selectionColor {
    if (widget.lockSelection) {
      return context.colorScheme.surfaceContainerHighest;
    }
    return context.isDarkTheme ? context.primaryColor.darken(amount: 0.4) : context.primaryColor.lighten(amount: 0.75);
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

typedef _SelectionColors = ({Color background, Color check});

class _SelectionFrame extends SingleChildRenderObjectWidget {
  final TickerProvider vsync;
  final _SelectionColors? colors;

  const _SelectionFrame({required this.vsync, required this.colors, required super.child});

  @override
  RenderObject createRenderObject(BuildContext context) => _RenderSelectionFrame(vsync, colors);

  @override
  void updateRenderObject(BuildContext context, _RenderSelectionFrame renderObject) {
    renderObject.colors = colors;
  }
}

class _RenderSelectionFrame extends RenderShiftedBox {
  static const _checkIcon = Icons.check_circle_rounded;
  static const _checkSize = 24.0;

  final TickerProvider _vsync;
  bool _selected;
  _SelectionColors? _colors;
  AnimationController? _controller;
  TextPainter? _check;

  _RenderSelectionFrame(this._vsync, this._colors) : _selected = _colors != null, super(null);

  double get _selection => _controller?.value ?? (_selected ? 1 : 0);

  set colors(_SelectionColors? value) {
    if (value != null && value != _colors) {
      _colors = value;
      _check?.dispose();
      _check = null;
      markNeedsPaint();
    }

    final selected = value != null;
    if (selected == _selected) {
      return;
    }
    _selected = selected;
    final controller = _controller ??= AnimationController(vsync: _vsync, value: selected ? 0 : 1)
      ..addListener(markNeedsLayout);
    unawaited(controller.animateTo(selected ? 1 : 0, duration: Durations.short4, curve: Curves.decelerate));
  }

  @override
  void dispose() {
    _controller?.dispose();
    _check?.dispose();
    super.dispose();
  }

  @override
  bool hitTestSelf(Offset position) => true;

  @override
  void performLayout() {
    size = constraints.biggest;
    final inset = 6 * _selection;
    final child = this.child!;
    child.layout(BoxConstraints.tight(Size(size.width - 2 * inset, size.height - 2 * inset)));
    (child.parentData! as BoxParentData).offset = Offset(inset, inset);
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final selection = _selection;
    if (selection == 0) {
      layer = null;
      super.paint(context, offset);
      return;
    }

    final colors = _colors!;
    context.canvas.drawRect(offset & size, Paint()..color = colors.background);
    final content = (Offset.zero & size).deflate(6 * selection);
    layer = context.pushClipRRect(
      needsCompositing,
      offset,
      content,
      RRect.fromRectAndRadius(content, Radius.circular(15 * selection)),
      super.paint,
      oldLayer: layer as ClipRRectLayer?,
    );
    _paintCheck(context.canvas, offset, colors, selection);
  }

  void _paintCheck(Canvas canvas, Offset offset, _SelectionColors colors, double selection) {
    final padding = _selected ? 3 * selection : 3.0;
    final bounds = (offset + Offset(padding, padding)) & const Size.square(_checkSize);
    if (!_selected) {
      canvas.saveLayer(bounds, Paint()..color = Color.fromRGBO(0, 0, 0, selection));
    }
    canvas.drawCircle(bounds.center, _checkSize / 2, Paint()..color = colors.background);
    final check = _check ??= TextPainter(
      text: TextSpan(
        text: String.fromCharCode(_checkIcon.codePoint),
        style: TextStyle(
          inherit: false,
          color: colors.check,
          fontSize: _checkSize,
          fontFamily: _checkIcon.fontFamily,
          package: _checkIcon.fontPackage,
          height: 1,
          leadingDistribution: TextLeadingDistribution.even,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    check.paint(canvas, bounds.center - check.size.center(Offset.zero));
    if (!_selected) {
      canvas.restore();
    }
  }
}

class _Fade extends SingleChildRenderObjectWidget {
  final TickerProvider vsync;
  final bool visible;

  const _Fade({required this.vsync, required this.visible, required super.child});

  @override
  RenderObject createRenderObject(BuildContext context) => _RenderFade(vsync, visible);

  @override
  void updateRenderObject(BuildContext context, _RenderFade renderObject) {
    renderObject.visible = visible;
  }
}

class _RenderFade extends RenderAnimatedOpacity {
  final TickerProvider _vsync;
  bool _visible;
  AnimationController? _controller;

  _RenderFade(this._vsync, this._visible)
    : super(opacity: _visible ? kAlwaysCompleteAnimation : kAlwaysDismissedAnimation);

  set visible(bool value) {
    if (value == _visible) {
      return;
    }
    _visible = value;
    final controller = _controller ??= AnimationController(vsync: _vsync, value: value ? 0 : 1);
    opacity = controller;
    unawaited(controller.animateTo(value ? 1 : 0, duration: Durations.short4));
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
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
