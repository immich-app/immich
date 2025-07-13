import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/top_app_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view_gallery.dart';
import 'package:platform/platform.dart';

@RoutePage()
class AssetViewerPage extends StatelessWidget {
  final int initialIndex;
  final TimelineService timelineService;

  const AssetViewerPage({
    super.key,
    required this.initialIndex,
    required this.timelineService,
  });

  @override
  Widget build(BuildContext context) {
    // This is necessary to ensure that the timeline service is available
    // since the Timeline and AssetViewer are on different routes / Widget subtrees.
    return ProviderScope(
      overrides: [timelineServiceProvider.overrideWithValue(timelineService)],
      child: AssetViewer(initialIndex: initialIndex),
    );
  }
}

class AssetViewer extends ConsumerStatefulWidget {
  final int initialIndex;
  final Platform? platform;

  const AssetViewer({
    super.key,
    required this.initialIndex,
    this.platform,
  });

  @override
  ConsumerState createState() => _AssetViewerState();
}

const double _kBottomSheetMinimumExtent = 0.4;
const double _kBottomSheetSnapExtent = 0.7;

class _AssetViewerState extends ConsumerState<AssetViewer> {
  late PageController pageController;
  late DraggableScrollableController bottomSheetController;
  PersistentBottomSheetController? sheetCloseController;
  // PhotoViewGallery takes care of disposing it's controllers
  PhotoViewControllerBase? viewController;
  StreamSubscription? reloadSubscription;

  late Platform platform;
  late final int heroOffset;
  late PhotoViewControllerValue initialPhotoViewState;
  bool? hasDraggedDown;
  bool isSnapping = false;
  bool blockGestures = false;
  bool dragInProgress = false;
  bool shouldPopOnDrag = false;
  double? initialScale;
  double previousExtent = _kBottomSheetMinimumExtent;
  Offset dragDownPosition = Offset.zero;
  int totalAssets = 0;
  BuildContext? scaffoldContext;
  Map<String, GlobalKey> videoPlayerKeys = {};

  // Delayed operations that should be cancelled on disposal
  final List<Timer> _delayedOperations = [];

  @override
  void initState() {
    super.initState();
    pageController = PageController(initialPage: widget.initialIndex);
    platform = widget.platform ?? const LocalPlatform();
    totalAssets = ref.read(timelineServiceProvider).totalAssets;
    bottomSheetController = DraggableScrollableController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _onAssetChanged(widget.initialIndex);
    });
    reloadSubscription = EventStream.shared.listen(_onEvent);
    heroOffset = TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
  }

  @override
  void dispose() {
    pageController.dispose();
    bottomSheetController.dispose();
    _cancelTimers();
    reloadSubscription?.cancel();
    super.dispose();
  }

  bool get showingBottomSheet =>
      ref.read(assetViewerProvider.select((s) => s.showingBottomSheet));

  Color get backgroundColor {
    final opacity =
        ref.read(assetViewerProvider.select((s) => s.backgroundOpacity));
    return Colors.black.withAlpha(opacity);
  }

  void _cancelTimers() {
    for (final timer in _delayedOperations) {
      timer.cancel();
    }
    _delayedOperations.clear();
  }

  // This is used to calculate the scale of the asset when the bottom sheet is showing.
  // It is a small increment to ensure that the asset is slightly zoomed in when the
  // bottom sheet is showing, which emulates the zoom effect.
  double get _getScaleForBottomSheet =>
      (viewController?.prevValue.scale ?? viewController?.value.scale ?? 1.0) +
      0.01;

  double _getVerticalOffsetForBottomSheet(double extent) =>
      (context.height * extent) - (context.height * _kBottomSheetMinimumExtent);

  Future<void> _precacheImage(int index) async {
    if (!mounted || index < 0 || index >= totalAssets) {
      return;
    }

    final asset = ref.read(timelineServiceProvider).getAsset(index);
    final screenSize = Size(context.width, context.height);

    // Precache both thumbnail and full image for smooth transitions
    unawaited(
      Future.wait([
        precacheImage(
          getThumbnailImageProvider(asset: asset, size: screenSize),
          context,
          onError: (_, __) {},
        ),
        precacheImage(
          getFullImageProvider(asset, size: screenSize),
          context,
          onError: (_, __) {},
        ),
      ]),
    );
  }

  void _onAssetChanged(int index) {
    final asset = ref.read(timelineServiceProvider).getAsset(index);
    ref.read(currentAssetNotifier.notifier).setAsset(asset);
    if (asset.isVideo) {
      ref.read(videoPlaybackValueProvider.notifier).reset();
      ref.read(videoPlayerControlsProvider.notifier).pause();
    }

    unawaited(ref.read(timelineServiceProvider).preCacheAssets(index));
    _cancelTimers();
    // This will trigger the pre-caching of adjacent assets ensuring
    // that they are ready when the user navigates to them.
    final timer = Timer(Durations.medium4, () {
      // Check if widget is still mounted before proceeding
      if (!mounted) return;

      for (final offset in [-1, 1]) {
        unawaited(_precacheImage(index + offset));
      }
    });
    _delayedOperations.add(timer);
  }

  void _onPageBuild(PhotoViewControllerBase controller) {
    viewController ??= controller;
    if (showingBottomSheet) {
      final verticalOffset = (context.height * bottomSheetController.size) -
          (context.height * _kBottomSheetMinimumExtent);
      controller.position = Offset(0, -verticalOffset);
    }
  }

  void _onPageChanged(int index, PhotoViewControllerBase? controller) {
    _onAssetChanged(index);
    viewController = controller;

    // If the bottom sheet is showing, we need to adjust scale the asset to
    // emulate the zoom effect
    if (showingBottomSheet) {
      initialScale = controller?.scale;
      controller?.scale = _getScaleForBottomSheet;
    }
  }

  void _onDragStart(
    _,
    DragStartDetails details,
    PhotoViewControllerBase controller,
    PhotoViewScaleStateController scaleStateController,
  ) {
    viewController = controller;
    dragDownPosition = details.localPosition;
    initialPhotoViewState = controller.value;
    final isZoomed =
        scaleStateController.scaleState == PhotoViewScaleState.zoomedIn ||
            scaleStateController.scaleState == PhotoViewScaleState.covering;
    if (!showingBottomSheet && isZoomed) {
      blockGestures = true;
    }
  }

  void _onDragEnd(BuildContext ctx, _, __) {
    dragInProgress = false;

    if (shouldPopOnDrag) {
      // Dismiss immediately without state updates to avoid rebuilds
      ctx.maybePop();
      return;
    }

    // Do not reset the state if the bottom sheet is showing
    if (showingBottomSheet) {
      _snapBottomSheet();
      return;
    }

    // If the gestures are blocked, do not reset the state
    if (blockGestures) {
      blockGestures = false;
      return;
    }

    shouldPopOnDrag = false;
    hasDraggedDown = null;
    viewController?.animateMultiple(
      position: initialPhotoViewState.position,
      scale: initialPhotoViewState.scale,
      rotation: initialPhotoViewState.rotation,
    );
    ref.read(assetViewerProvider.notifier).setOpacity(255);
  }

  void _onDragUpdate(BuildContext ctx, DragUpdateDetails details, _) {
    if (blockGestures) {
      return;
    }

    dragInProgress = true;
    final delta = details.localPosition - dragDownPosition;
    hasDraggedDown ??= delta.dy > 0;
    if (!hasDraggedDown! || showingBottomSheet) {
      _handleDragUp(ctx, delta);
      return;
    }

    _handleDragDown(ctx, delta);
  }

  void _handleDragUp(BuildContext ctx, Offset delta) {
    const double openThreshold = 50;

    final position = initialPhotoViewState.position + Offset(0, delta.dy);
    final distanceToOrigin = position.distance;

    viewController?.updateMultiple(position: position);
    // Moves the bottom sheet when the asset is being dragged up
    if (showingBottomSheet && bottomSheetController.isAttached) {
      final centre = (ctx.height * _kBottomSheetMinimumExtent);
      bottomSheetController.jumpTo((centre + distanceToOrigin) / ctx.height);
    }

    if (distanceToOrigin > openThreshold && !showingBottomSheet) {
      _openBottomSheet(ctx);
    }
  }

  void _handleDragDown(BuildContext ctx, Offset delta) {
    const double dragRatio = 0.2;
    const double popThreshold = 75;

    final distance = delta.distance;
    shouldPopOnDrag = delta.dy > 0 && distance > popThreshold;

    final maxScaleDistance = ctx.height * 0.5;
    final scaleReduction = (distance / maxScaleDistance).clamp(0.0, dragRatio);
    double? updatedScale;
    if (initialPhotoViewState.scale != null) {
      updatedScale = initialPhotoViewState.scale! * (1.0 - scaleReduction);
    }

    final backgroundOpacity =
        (255 * (1.0 - (scaleReduction / dragRatio))).round();

    viewController?.updateMultiple(
      position: initialPhotoViewState.position + delta,
      scale: updatedScale,
    );
    ref.read(assetViewerProvider.notifier).setOpacity(backgroundOpacity);
  }

  void _onTapDown(_, __, ___) {
    if (!showingBottomSheet) {
      ref.read(assetViewerProvider.notifier).toggleControls();
    }
  }

  bool _onNotification(Notification delta) {
    if (delta is DraggableScrollableNotification) {
      _handleDraggableNotification(delta);
    }

    // Handle sheet snap manually so that the it snaps only at _kBottomSheetSnapExtent but not after
    // the isSnapping guard is to prevent the notification from recursively handling the
    // notification, eventually resulting in a heap overflow
    if (!isSnapping && delta is ScrollEndNotification) {
      _snapBottomSheet();
    }
    return false;
  }

  void _handleDraggableNotification(DraggableScrollableNotification delta) {
    final currentExtent = delta.extent;
    final isDraggingDown = currentExtent < previousExtent;
    previousExtent = currentExtent;
    // Closes the bottom sheet if the user is dragging down
    if (isDraggingDown && delta.extent < 0.55) {
      if (dragInProgress) {
        blockGestures = true;
      }
      sheetCloseController?.close();
    }

    // If the asset is being dragged down, we do not want to update the asset position again
    if (dragInProgress) {
      return;
    }

    final verticalOffset = _getVerticalOffsetForBottomSheet(delta.extent);
    // Moves the asset when the bottom sheet is being dragged
    if (verticalOffset > 0) {
      viewController?.position = Offset(0, -verticalOffset);
    }
  }

  void _onEvent(Event event) {
    if (event is TimelineReloadEvent) {
      _onTimelineReload(event);
      return;
    }

    if (event is ViewerOpenBottomSheetEvent) {
      final extent = _kBottomSheetMinimumExtent + 0.3;
      _openBottomSheet(scaffoldContext!, extent: extent);
      final offset = _getVerticalOffsetForBottomSheet(extent);
      viewController?.position = Offset(0, -offset);
      return;
    }
  }

  void _onTimelineReload(_) {
    setState(() {
      totalAssets = ref.read(timelineServiceProvider).totalAssets;
      if (totalAssets == 0) {
        context.maybePop();
        return;
      }

      final index = pageController.page?.round() ?? 0;
      final newAsset = ref.read(timelineServiceProvider).getAsset(index);
      final currentAsset = ref.read(currentAssetNotifier);
      // Do not reload / close the bottom sheet if the asset has not changed
      if (newAsset.heroTag == currentAsset?.heroTag) {
        return;
      }

      _onAssetChanged(pageController.page!.round());
      sheetCloseController?.close();
    });
  }

  void _openBottomSheet(
    BuildContext ctx, {
    double extent = _kBottomSheetMinimumExtent,
  }) {
    ref.read(assetViewerProvider.notifier).setBottomSheet(true);
    initialScale = viewController?.scale;
    viewController?.updateMultiple(scale: _getScaleForBottomSheet);
    previousExtent = _kBottomSheetMinimumExtent;
    sheetCloseController = showBottomSheet(
      context: ctx,
      sheetAnimationStyle: const AnimationStyle(
        duration: Durations.short4,
        reverseDuration: Durations.short2,
      ),
      constraints: const BoxConstraints(maxWidth: double.infinity),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.0)),
      ),
      backgroundColor: ctx.colorScheme.surfaceContainerLowest,
      builder: (_) {
        return NotificationListener<Notification>(
          onNotification: _onNotification,
          child: AssetDetailBottomSheet(
            controller: bottomSheetController,
            initialChildSize: extent,
          ),
        );
      },
    );
    sheetCloseController?.closed.then((_) => _handleSheetClose());
  }

  void _handleSheetClose() {
    viewController?.animateMultiple(position: Offset.zero);
    viewController?.updateMultiple(scale: initialScale);
    ref.read(assetViewerProvider.notifier).setBottomSheet(false);
    sheetCloseController = null;
    shouldPopOnDrag = false;
    hasDraggedDown = null;
  }

  void _snapBottomSheet() {
    if (bottomSheetController.size > _kBottomSheetSnapExtent ||
        bottomSheetController.size < 0.4) {
      return;
    }
    isSnapping = true;
    bottomSheetController.animateTo(
      _kBottomSheetSnapExtent,
      duration: Durations.short3,
      curve: Curves.easeOut,
    );
  }

  Widget _placeholderBuilder(
    BuildContext ctx,
    ImageChunkEvent? progress,
    int index,
  ) {
    final asset = ref.read(timelineServiceProvider).getAsset(index);
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: backgroundColor,
      child: Thumbnail(
        asset: asset,
        fit: BoxFit.contain,
        size: Size(
          ctx.width,
          ctx.height,
        ),
      ),
    );
  }

  void _onScaleStateChanged(PhotoViewScaleState scaleState) {
    if (scaleState != PhotoViewScaleState.initial) {
      ref.read(videoPlayerControlsProvider.notifier).pause();
    }
  }

  PhotoViewGalleryPageOptions _assetBuilder(BuildContext ctx, int index) {
    scaffoldContext ??= ctx;
    final asset = ref.read(timelineServiceProvider).getAsset(index);

    if (asset.isImage) {
      return _imageBuilder(ctx, asset);
    }

    return _videoBuilder(ctx, asset);
  }

  PhotoViewGalleryPageOptions _imageBuilder(BuildContext ctx, BaseAsset asset) {
    final size = Size(ctx.width, ctx.height);
    return PhotoViewGalleryPageOptions(
      key: ValueKey(asset.heroTag),
      imageProvider: getFullImageProvider(asset, size: size),
      heroAttributes:
          PhotoViewHeroAttributes(tag: '${asset.heroTag}_$heroOffset'),
      filterQuality: FilterQuality.high,
      tightMode: true,
      initialScale: PhotoViewComputedScale.contained * 0.999,
      minScale: PhotoViewComputedScale.contained * 0.999,
      disableScaleGestures: showingBottomSheet,
      onDragStart: _onDragStart,
      onDragUpdate: _onDragUpdate,
      onDragEnd: _onDragEnd,
      onTapDown: _onTapDown,
      errorBuilder: (_, __, ___) => Container(
        width: ctx.width,
        height: ctx.height,
        color: backgroundColor,
        child: Thumbnail(
          asset: asset,
          fit: BoxFit.contain,
          size: size,
        ),
      ),
    );
  }

  GlobalKey _getVideoPlayerKey(String id) {
    videoPlayerKeys.putIfAbsent(id, () => GlobalKey());
    return videoPlayerKeys[id]!;
  }

  PhotoViewGalleryPageOptions _videoBuilder(BuildContext ctx, BaseAsset asset) {
    return PhotoViewGalleryPageOptions.customChild(
      onDragStart: _onDragStart,
      onDragUpdate: _onDragUpdate,
      onDragEnd: _onDragEnd,
      onTapDown: _onTapDown,
      heroAttributes:
          PhotoViewHeroAttributes(tag: '${asset.heroTag}_$heroOffset'),
      filterQuality: FilterQuality.high,
      initialScale: PhotoViewComputedScale.contained * 0.99,
      maxScale: 1.0,
      minScale: PhotoViewComputedScale.contained * 0.99,
      basePosition: Alignment.center,
      child: SizedBox(
        width: ctx.width,
        height: ctx.height,
        child: NativeVideoViewer(
          key: _getVideoPlayerKey(asset.heroTag),
          asset: asset,
          image: Image(
            key: ValueKey(asset),
            image:
                getFullImageProvider(asset, size: Size(ctx.width, ctx.height)),
            fit: BoxFit.contain,
            height: ctx.height,
            width: ctx.width,
            alignment: Alignment.center,
          ),
        ),
      ),
    );
  }

  void _onPop<T>(bool didPop, T? result) {
    ref.read(currentAssetNotifier.notifier).dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Rebuild the widget when the asset viewer state changes
    // Using multiple selectors to avoid unnecessary rebuilds for other state changes
    ref.watch(assetViewerProvider.select((s) => s.showingBottomSheet));
    ref.watch(assetViewerProvider.select((s) => s.backgroundOpacity));

    // Currently it is not possible to scroll the asset when the bottom sheet is open all the way.
    // Issue: https://github.com/flutter/flutter/issues/109037
    // TODO: Add a custom scrum builder once the fix lands on stable
    return PopScope(
      onPopInvokedWithResult: _onPop,
      child: Scaffold(
        backgroundColor: backgroundColor,
        appBar: const ViewerTopAppBar(),
        extendBody: true,
        extendBodyBehindAppBar: true,
        body: PhotoViewGallery.builder(
          gaplessPlayback: true,
          loadingBuilder: _placeholderBuilder,
          pageController: pageController,
          scrollPhysics: platform.isIOS
              ? const FastScrollPhysics() // Use bouncing physics for iOS
              : const FastClampingScrollPhysics() // Use heavy physics for Android
          ,
          itemCount: totalAssets,
          onPageChanged: _onPageChanged,
          onPageBuild: _onPageBuild,
          scaleStateChangedCallback: _onScaleStateChanged,
          builder: _assetBuilder,
          backgroundDecoration: BoxDecoration(color: backgroundColor),
          enablePanAlways: true,
        ),
        bottomNavigationBar: const ViewerBottomBar(),
      ),
    );
  }
}
