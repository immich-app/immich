import 'dart:async';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart' show Drag, kTouchSlop;
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

enum _DragIntent { none, scroll, dismiss }

class AssetPage extends ConsumerStatefulWidget {
  final int index;
  final int heroOffset;
  final void Function(int direction)? onTapNavigate;

  const AssetPage({super.key, required this.index, required this.heroOffset, this.onTapNavigate});

  @override
  ConsumerState createState() => _AssetPageState();
}

class _AssetPageState extends ConsumerState<AssetPage> {
  PhotoViewControllerBase? _viewController;
  StreamSubscription? _scaleBoundarySub;
  StreamSubscription? _eventSubscription;

  AssetViewerStateNotifier get _viewer => ref.read(assetViewerProvider.notifier);

  late PhotoViewControllerValue _initialPhotoViewState;

  bool _showingDetails = false;
  bool _isZoomed = false;

  final _scrollController = SnapScrollController();
  double _snapOffset = 0.0;

  DragStartDetails? _dragStart;
  _DragIntent _dragIntent = _DragIntent.none;
  Drag? _drag;

  @override
  void initState() {
    super.initState();
    _eventSubscription = EventStream.shared.listen(_onEvent);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      _scrollController.snapPosition.snapOffset = _snapOffset;
      if (_showingDetails && _snapOffset > 0) {
        _scrollController.jumpTo(_snapOffset);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _scaleBoundarySub?.cancel();
    _eventSubscription?.cancel();
    super.dispose();
  }

  void _onEvent(Event event) {
    switch (event) {
      case ViewerShowDetailsEvent():
        _showDetails();
      default:
    }
  }

  void _showDetails() {
    if (!_scrollController.hasClients || _snapOffset <= 0) return;
    _viewer.setShowingDetails(true);
    _scrollController.animateTo(_snapOffset, duration: Durations.medium2, curve: Curves.easeOutCubic);
  }

  bool _willClose(double scrollVelocity) =>
      _scrollController.hasClients &&
      _snapOffset > 0 &&
      _scrollController.position.pixels < _snapOffset &&
      SnapScrollPhysics.target(_scrollController.position, scrollVelocity, _snapOffset) <
          SnapScrollPhysics.minSnapDistance;

  void _syncShowingDetails() {
    final offset = _scrollController.offset;
    if (offset > SnapScrollPhysics.minSnapDistance) {
      _viewer.setShowingDetails(true);
    } else if (offset < SnapScrollPhysics.minSnapDistance - kTouchSlop) {
      _viewer.setShowingDetails(false);
    }
  }

  void _beginDrag(DragStartDetails details) {
    _dragStart = details;

    if (_viewController != null) {
      _initialPhotoViewState = _viewController!.value;
    }

    if (_showingDetails) {
      _dragIntent = _DragIntent.scroll;
      _startProxyDrag();
    }
  }

  void _startProxyDrag() {
    if (_scrollController.hasClients && _dragStart != null) {
      _drag = _scrollController.position.drag(_dragStart!, () => _drag = null);
    }
  }

  void _updateDrag(DragUpdateDetails details) {
    if (_dragStart == null) return;

    if (_dragIntent == _DragIntent.none) {
      _dragIntent = switch ((details.globalPosition - _dragStart!.globalPosition).dy) {
        < 0 => _DragIntent.scroll,
        > 0 => _DragIntent.dismiss,
        _ => _DragIntent.none,
      };
    }

    switch (_dragIntent) {
      case _DragIntent.none:
      case _DragIntent.scroll:
        if (_drag == null) _startProxyDrag();
        _drag?.update(details);

        _syncShowingDetails();
      case _DragIntent.dismiss:
        _handleDragDown(context, details.localPosition - _dragStart!.localPosition);
    }
  }

  void _endDrag(DragEndDetails details) {
    if (_dragStart == null) return;

    final start = _dragStart;
    _dragStart = null;

    final intent = _dragIntent;
    _dragIntent = _DragIntent.none;

    switch (intent) {
      case _DragIntent.none:
      case _DragIntent.scroll:
        final scrollVelocity = -(details.primaryVelocity ?? 0.0);
        _viewer.setShowingDetails(!_willClose(scrollVelocity));

        _drag?.end(details);
        _drag = null;
      case _DragIntent.dismiss:
        const popThreshold = 75.0;
        if (details.localPosition.dy - start!.localPosition.dy > popThreshold) {
          context.maybePop();
          return;
        }
        _viewController?.animateMultiple(
          position: _initialPhotoViewState.position,
          scale: _viewController?.initialScale ?? _initialPhotoViewState.scale,
          rotation: _initialPhotoViewState.rotation,
        );
        _viewer.setOpacity(1.0);
    }
  }

  void _onDragStart(
    BuildContext context,
    DragStartDetails details,
    PhotoViewControllerBase controller,
    PhotoViewScaleStateController scaleStateController,
  ) {
    if (!_showingDetails && _isZoomed) return;
    _beginDrag(details);
  }

  void _onDragUpdate(BuildContext context, DragUpdateDetails details, PhotoViewControllerValue _) =>
      _updateDrag(details);

  void _onDragEnd(BuildContext context, DragEndDetails details, PhotoViewControllerValue _) => _endDrag(details);

  void _onDragCancel() => _endDrag(DragEndDetails(primaryVelocity: 0.0));

  void _handleDragDown(BuildContext context, Offset delta) {
    const dragRatio = 0.2;

    final distance = delta.dy.abs();
    final maxScaleDistance = context.height * 0.5;
    final scaleReduction = (distance / maxScaleDistance).clamp(0.0, dragRatio);
    final initialScale = _viewController?.initialScale ?? _initialPhotoViewState.scale;
    final updatedScale = initialScale != null ? initialScale * (1.0 - scaleReduction) : null;

    final opacity = 1.0 - (scaleReduction / dragRatio);

    _viewController?.updateMultiple(position: _initialPhotoViewState.position + delta, scale: updatedScale);
    _viewer.setOpacity(opacity);
  }

  void _onTapUp(BuildContext context, TapUpDetails details, PhotoViewControllerValue controllerValue) {
    if (_showingDetails || _dragStart != null) return;

    final tapToNavigate = ref.read(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.tapToNavigate);
    if (!tapToNavigate) {
      _viewer.toggleControls();
      return;
    }

    final tapX = details.globalPosition.dx;
    final screenWidth = context.width;

    // Navigate if the user taps in the leftmost or rightmost quarter of the screen
    final tappedLeftSide = tapX < screenWidth / 4;
    final tappedRightSide = tapX > screenWidth * (3 / 4);

    if (tappedLeftSide) {
      widget.onTapNavigate?.call(-1);
    } else if (tappedRightSide) {
      widget.onTapNavigate?.call(1);
    } else {
      _viewer.toggleControls();
    }
  }

  void _onLongPress(BuildContext context, LongPressStartDetails details, PhotoViewControllerValue controllerValue) =>
      ref.read(isPlayingMotionVideoProvider.notifier).playing = true;

  void _onScaleStateChanged(PhotoViewScaleState scaleState) {
    _isZoomed = scaleState == PhotoViewScaleState.zoomedIn || scaleState == PhotoViewScaleState.covering;
    _viewer.setZoomed(_isZoomed);

    if (scaleState != PhotoViewScaleState.initial) {
      if (_dragStart == null) _viewer.setControls(false);
      return;
    }

    if (!_showingDetails) _viewer.setControls(true);
  }

  void _listenForScaleBoundaries(PhotoViewControllerBase? controller) {
    _scaleBoundarySub?.cancel();
    _scaleBoundarySub = null;
    if (controller == null || controller.scaleBoundaries != null) return;
    _scaleBoundarySub = controller.outputStateStream.listen((_) {
      if (controller.scaleBoundaries != null) {
        _scaleBoundarySub?.cancel();
        _scaleBoundarySub = null;
        if (mounted) setState(() {});
      }
    });
  }

  double _getImageHeight(double maxWidth, double maxHeight, BaseAsset? asset) {
    final sb = _viewController?.scaleBoundaries;
    if (sb != null) return sb.childSize.height * sb.initialScale;

    if (asset == null || asset.width == null || asset.height == null) return maxHeight;

    final r = asset.width! / asset.height!;
    return math.min(maxWidth / r, maxHeight);
  }

  void _onPageBuild(PhotoViewControllerBase controller) {
    _viewController = controller;
    _listenForScaleBoundaries(controller);
  }

  Widget _buildPhotoView({
    required BaseAsset asset,
    required PhotoViewHeroAttributes? heroAttributes,
    required bool isCurrent,
    required bool isPlayingMotionVideo,
  }) {
    final size = context.sizeData;

    if (asset.isImage && !isPlayingMotionVideo) {
      return PhotoView(
        key: Key(asset.heroTag),
        index: widget.index,
        imageProvider: getFullImageProvider(asset, size: size),
        heroAttributes: heroAttributes,
        loadingBuilder: (context, progress, index) => const Center(child: ImmichLoadingIndicator()),
        gaplessPlayback: true,
        filterQuality: FilterQuality.high,
        tightMode: true,
        enablePanAlways: true,
        disableScaleGestures: _showingDetails,
        scaleStateChangedCallback: _onScaleStateChanged,
        onPageBuild: _onPageBuild,
        onDragStart: _onDragStart,
        onDragUpdate: _onDragUpdate,
        onDragEnd: _onDragEnd,
        onDragCancel: _onDragCancel,
        onTapUp: _onTapUp,
        onLongPressStart: asset.isMotionPhoto ? _onLongPress : null,
        errorBuilder: (_, __, ___) => SizedBox(
          width: size.width,
          height: size.height,
          child: Thumbnail.fromAsset(asset: asset, fit: BoxFit.contain),
        ),
      );
    }

    return PhotoView.customChild(
      key: Key(asset.heroTag),
      childSize: asset.width != null && asset.height != null
          ? Size(asset.width!.toDouble(), asset.height!.toDouble())
          : null,
      onDragStart: _onDragStart,
      onDragUpdate: _onDragUpdate,
      onDragEnd: _onDragEnd,
      onDragCancel: _onDragCancel,
      onTapUp: _onTapUp,
      scaleStateChangedCallback: _onScaleStateChanged,
      heroAttributes: heroAttributes,
      filterQuality: FilterQuality.high,
      basePosition: Alignment.center,
      disableScaleGestures: _showingDetails,
      minScale: PhotoViewComputedScale.contained,
      initialScale: PhotoViewComputedScale.contained,
      tightMode: true,
      onPageBuild: _onPageBuild,
      enablePanAlways: true,
      child: NativeVideoViewer(
        key: _NativeVideoViewerKey(asset.heroTag),
        asset: asset,
        isCurrent: isCurrent,
        image: Image(
          image: getFullImageProvider(asset, size: size),
          fit: BoxFit.contain,
          alignment: Alignment.center,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentHeroTag = ref.watch(assetViewerProvider.select((s) => s.currentAsset?.heroTag));
    _showingDetails = ref.watch(assetViewerProvider.select((s) => s.showingDetails));
    final stackIndex = ref.watch(assetViewerProvider.select((s) => s.stackIndex));
    final isPlayingMotionVideo = ref.watch(isPlayingMotionVideoProvider);

    final asset = ref.read(timelineServiceProvider).getAssetSafe(widget.index);
    if (asset == null) {
      return const Center(child: ImmichLoadingIndicator());
    }

    BaseAsset displayAsset = asset;
    final stackChildren = ref.watch(stackChildrenNotifier(asset)).valueOrNull;
    if (stackChildren != null && stackChildren.isNotEmpty) {
      displayAsset = stackChildren.elementAt(stackIndex);
    }

    final isCurrent = currentHeroTag == displayAsset.heroTag;

    final viewportWidth = MediaQuery.widthOf(context);
    final viewportHeight = MediaQuery.heightOf(context);
    final imageHeight = _getImageHeight(viewportWidth, viewportHeight, displayAsset);

    final detailsOffset = (viewportHeight + imageHeight - kMinInteractiveDimension) / 2;
    final snapTarget = viewportHeight / 3;

    _snapOffset = detailsOffset - snapTarget;

    if (_scrollController.hasClients) {
      _scrollController.snapPosition.snapOffset = _snapOffset;
    }

    return Stack(
      children: [
        SingleChildScrollView(
          controller: _scrollController,
          physics: const SnapScrollPhysics(),
          child: ColoredBox(
            color: _showingDetails ? Colors.black : Colors.transparent,
            child: Stack(
              children: [
                SizedBox(
                  width: viewportWidth,
                  height: viewportHeight,
                  child: _buildPhotoView(
                    asset: displayAsset,
                    heroAttributes: isCurrent
                        ? PhotoViewHeroAttributes(tag: '${asset.heroTag}_${widget.heroOffset}')
                        : null,
                    isCurrent: isCurrent,
                    isPlayingMotionVideo: isPlayingMotionVideo,
                  ),
                ),
                IgnorePointer(
                  ignoring: !_showingDetails,
                  child: Column(
                    children: [
                      SizedBox(height: detailsOffset),
                      GestureDetector(
                        onVerticalDragStart: _beginDrag,
                        onVerticalDragUpdate: _updateDrag,
                        onVerticalDragEnd: _endDrag,
                        onVerticalDragCancel: _onDragCancel,
                        child: AnimatedOpacity(
                          opacity: _showingDetails ? 1.0 : 0.0,
                          duration: Durations.short2,
                          child: AssetDetails(asset: displayAsset, minHeight: viewportHeight - snapTarget),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (stackChildren != null && stackChildren.isNotEmpty)
          Positioned(
            left: 0,
            right: 0,
            bottom: context.padding.bottom,
            child: AssetStackRow(stack: stackChildren),
          ),
      ],
    );
  }
}

// A global key is used for video viewers to prevent them from being
// unnecessarily recreated. They're quite expensive, and maintain internal
// state. This can cause videos to restart multiple times during normal usage,
// like a hero animation.
//
// A plain ValueKey is insufficient, as it does not allow widgets to reparent. A
// GlobalObjectKey is fragile, as it checks if the given objects are identical,
// rather than equal. Hero tags are created with string interpolation, which
// prevents Dart from interning them. As such, hero tags are not identical, even
// if they are equal.
class _NativeVideoViewerKey extends GlobalKey {
  final String value;

  const _NativeVideoViewerKey(this.value) : super.constructor();

  @override
  bool operator ==(Object other) => other is _NativeVideoViewerKey && other.value == value;

  @override
  int get hashCode => value.hashCode;
}
