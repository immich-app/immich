import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/rendering.dart';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_status_floating_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_details.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/top_app_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view_gallery.dart';

@RoutePage()
class AssetViewerPage extends StatelessWidget {
  final int initialIndex;
  final TimelineService timelineService;
  final int? heroOffset;
  final RemoteAlbum? currentAlbum;

  const AssetViewerPage({
    super.key,
    required this.initialIndex,
    required this.timelineService,
    this.heroOffset,
    this.currentAlbum,
  });

  @override
  Widget build(BuildContext context) {
    // This is necessary to ensure that the timeline service is available
    // since the Timeline and AssetViewer are on different routes / Widget subtrees.
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWithValue(timelineService),
        currentRemoteAlbumScopedProvider.overrideWithValue(currentAlbum),
      ],
      child: AssetViewer(initialIndex: initialIndex, heroOffset: heroOffset),
    );
  }
}

class AssetViewer extends ConsumerStatefulWidget {
  final int initialIndex;
  final int? heroOffset;

  const AssetViewer({super.key, required this.initialIndex, this.heroOffset});

  @override
  ConsumerState createState() => _AssetViewerState();

  static void setAsset(WidgetRef ref, BaseAsset asset) {
    ref.read(assetViewerProvider.notifier).reset();
    _setAsset(ref, asset);
  }

  void changeAsset(WidgetRef ref, BaseAsset asset) {
    _setAsset(ref, asset);
  }

  static void _setAsset(WidgetRef ref, BaseAsset asset) {
    // Always holds the current asset from the timeline
    ref.read(assetViewerProvider.notifier).setAsset(asset);
    // The currentAssetNotifier actually holds the current asset that is displayed
    // which could be stack children as well
    ref.read(currentAssetNotifier.notifier).setAsset(asset);
    if (asset.isVideo || asset.isMotionPhoto) {
      ref.read(videoPlaybackValueProvider.notifier).reset();
      ref.read(videoPlayerControlsProvider.notifier).pause();
    }
    // Hide controls by default for videos
    if (asset.isVideo) {
      ref.read(assetViewerProvider.notifier).setControls(false);
    }
  }
}

class _AssetViewerState extends ConsumerState<AssetViewer> {
  static final _dummyListener = ImageStreamListener((image, _) => image.dispose());
  late PageController pageController;
  // PhotoViewGallery takes care of disposing it's controllers
  PhotoViewControllerBase? viewController;
  StreamSubscription? reloadSubscription;

  late final int heroOffset;
  late PhotoViewControllerValue initialPhotoViewState;
  bool? hasDraggedDown;
  bool blockGestures = false;
  bool dragInProgress = false;
  bool shouldPopOnDrag = false;
  bool assetReloadRequested = false;
  Offset dragDownPosition = Offset.zero;
  int totalAssets = 0;
  int stackIndex = 0;
  BuildContext? scaffoldContext;
  Map<String, GlobalKey> videoPlayerKeys = {};

  // Delayed operations that should be cancelled on disposal
  final List<Timer> _delayedOperations = [];

  ImageStream? _prevPreCacheStream;
  ImageStream? _nextPreCacheStream;

  KeepAliveLink? _stackChildrenKeepAlive;

  final ScrollController _scrollController = ScrollController();
  double _assetDetailsOpacity = 0.0;

  // final _assetDetailsSnap = 5;

  @override
  void initState() {
    super.initState();
    assert(ref.read(currentAssetNotifier) != null, "Current asset should not be null when opening the AssetViewer");
    pageController = PageController(initialPage: widget.initialIndex);
    _scrollController.addListener(_onScroll);
    totalAssets = ref.read(timelineServiceProvider).totalAssets;
    WidgetsBinding.instance.addPostFrameCallback(_onAssetInit);
    reloadSubscription = EventStream.shared.listen(_onEvent);
    heroOffset = widget.heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
    final asset = ref.read(currentAssetNotifier);
    if (asset != null) {
      _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();
    }
    if (ref.read(assetViewerProvider).showingControls) {
      unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge));
    } else {
      unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky));
    }
  }

  void _onScroll() {
    setState(() {
      // _assetDetailsOpacity = (_scrollController.offset / 50).clamp(0.0, 1.0);
      _assetDetailsOpacity = _scrollController.offset > 10 ? 1 : 0;

      if (_assetDetailsOpacity == 0) {
        ref.read(assetViewerProvider.notifier).setControls(true);
      } else {
        ref.read(assetViewerProvider.notifier).setControls(false);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    pageController.dispose();
    _cancelTimers();
    reloadSubscription?.cancel();
    _prevPreCacheStream?.removeListener(_dummyListener);
    _nextPreCacheStream?.removeListener(_dummyListener);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _stackChildrenKeepAlive?.close();
    super.dispose();
  }

  bool get showingBottomSheet => _scrollController.offset > 0;

  Color get backgroundColor {
    final opacity = ref.read(assetViewerProvider.select((s) => s.backgroundOpacity));
    return Colors.black.withAlpha(opacity);
  }

  void _cancelTimers() {
    for (final timer in _delayedOperations) {
      timer.cancel();
    }
    _delayedOperations.clear();
  }

  ImageStream _precacheImage(BaseAsset asset) {
    final provider = getFullImageProvider(asset, size: context.sizeData);
    return provider.resolve(ImageConfiguration.empty)..addListener(_dummyListener);
  }

  void _precacheAssets(int index) {
    final timelineService = ref.read(timelineServiceProvider);
    unawaited(timelineService.preCacheAssets(index));
    _cancelTimers();
    // This will trigger the pre-caching of adjacent assets ensuring
    // that they are ready when the user navigates to them.
    final timer = Timer(Durations.medium4, () async {
      // Check if widget is still mounted before proceeding
      if (!mounted) return;

      final (prevAsset, nextAsset) = await (
        timelineService.getAssetAsync(index - 1),
        timelineService.getAssetAsync(index + 1),
      ).wait;
      if (!mounted) return;
      _prevPreCacheStream?.removeListener(_dummyListener);
      _nextPreCacheStream?.removeListener(_dummyListener);
      _prevPreCacheStream = prevAsset != null ? _precacheImage(prevAsset) : null;
      _nextPreCacheStream = nextAsset != null ? _precacheImage(nextAsset) : null;
    });
    _delayedOperations.add(timer);
  }

  void _onAssetInit(Duration _) {
    _precacheAssets(widget.initialIndex);
    _handleCasting();
  }

  void _onAssetChanged(int index) async {
    final timelineService = ref.read(timelineServiceProvider);
    final asset = await timelineService.getAssetAsync(index);
    if (asset == null) {
      return;
    }

    widget.changeAsset(ref, asset);
    _precacheAssets(index);
    _handleCasting();
    _stackChildrenKeepAlive?.close();
    _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();
  }

  void _handleCasting() {
    if (!ref.read(castProvider).isCasting) return;
    final asset = ref.read(currentAssetNotifier);
    if (asset == null) return;

    // hide any casting snackbars if they exist
    context.scaffoldMessenger.hideCurrentSnackBar();

    // send image to casting if the server has it
    if (asset is RemoteAsset) {
      ref.read(castProvider.notifier).loadMedia(asset, false);
    } else {
      // casting cannot show local assets
      context.scaffoldMessenger.clearSnackBars();

      if (ref.read(castProvider).isCasting) {
        ref.read(castProvider.notifier).stop();
        context.scaffoldMessenger.showSnackBar(
          SnackBar(
            duration: const Duration(seconds: 2),
            content: Text(
              "local_asset_cast_failed".tr(),
              style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
            ),
          ),
        );
      }
    }
  }

  void _onPageChanged(int index, PhotoViewControllerBase? controller) {
    _onAssetChanged(index);
    viewController = controller;
  }

  bool onScrollNotification(ScrollNotification notification) {
    if (notification is ScrollStartNotification) {
      // Drag started
      print('Scroll/drag started');
      // final dragDetails = notification.dragDetails;
      // _onDragStart(_, notification.dragDetails, controller, scaleStateController)
    } else if (notification is ScrollUpdateNotification) {
      // Drag is ongoing
      print('Scroll offset: ${notification.metrics.pixels}');
    } else if (notification is ScrollEndNotification) {
      // Drag ended
      print('Scroll/drag ended');
    }
    return false; // return false to allow the notification to continue propagating
  }

  void _onDragStart(
    _,
    DragStartDetails details,
    PhotoViewControllerBase controller,
    PhotoViewScaleStateController scaleStateController,
  ) {
    print("photoview drag start");
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
      scale: viewController?.initialScale ?? initialPhotoViewState.scale,
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
      return;
    }

    _handleDragDown(ctx, delta);
  }

  void _handleDragDown(BuildContext ctx, Offset delta) {
    print("drag down");
    const double dragRatio = 0.2;
    const double popThreshold = 75;

    final distance = delta.distance;
    shouldPopOnDrag = delta.dy > 0 && distance > popThreshold;

    final maxScaleDistance = ctx.height * 0.5;
    final scaleReduction = (distance / maxScaleDistance).clamp(0.0, dragRatio);
    double? updatedScale;
    double? initialScale = viewController?.initialScale ?? initialPhotoViewState.scale;
    if (initialScale != null) {
      updatedScale = initialScale * (1.0 - scaleReduction);
    }

    final backgroundOpacity = (255 * (1.0 - (scaleReduction / dragRatio))).round();

    viewController?.updateMultiple(position: initialPhotoViewState.position + delta, scale: updatedScale);
    ref.read(assetViewerProvider.notifier).setOpacity(backgroundOpacity);
  }

  void _onTapDown(_, __, ___) {
    if (!showingBottomSheet) {
      ref.read(assetViewerProvider.notifier).toggleControls();
    }
  }

  void _onEvent(Event event) {
    if (event is TimelineReloadEvent) {
      _onTimelineReloadEvent();
      return;
    }

    if (event is ViewerReloadAssetEvent) {
      assetReloadRequested = true;
      return;
    }
  }

  void _onTimelineReloadEvent() {
    totalAssets = ref.read(timelineServiceProvider).totalAssets;
    if (totalAssets == 0) {
      context.maybePop();
      return;
    }

    if (assetReloadRequested) {
      assetReloadRequested = false;
      _onAssetReloadEvent();
      return;
    }
  }

  void _onAssetReloadEvent() async {
    final index = pageController.page?.round() ?? 0;
    final timelineService = ref.read(timelineServiceProvider);
    final newAsset = await timelineService.getAssetAsync(index);

    if (newAsset == null) {
      return;
    }

    final currentAsset = ref.read(currentAssetNotifier);
    // Do not reload / close the bottom sheet if the asset has not changed
    if (newAsset.heroTag == currentAsset?.heroTag) {
      return;
    }

    setState(() {
      _onAssetChanged(pageController.page!.round());
    });
  }

  Widget _placeholderBuilder(BuildContext ctx, ImageChunkEvent? progress, int index) {
    return const Center(child: ImmichLoadingIndicator());
  }

  void _onScaleStateChanged(PhotoViewScaleState scaleState) {
    if (scaleState != PhotoViewScaleState.initial) {
      if (!dragInProgress) {
        ref.read(assetViewerProvider.notifier).setControls(false);
      }
      ref.read(videoPlayerControlsProvider.notifier).pause();
      return;
    }

    if (!showingBottomSheet) {
      ref.read(assetViewerProvider.notifier).setControls(true);
    }
  }

  void _onLongPress(_, __, ___) {
    ref.read(isPlayingMotionVideoProvider.notifier).playing = true;
  }

  PhotoViewGalleryPageOptions _assetBuilder(BuildContext ctx, int index) {
    scaffoldContext ??= ctx;
    final timelineService = ref.read(timelineServiceProvider);
    final asset = timelineService.getAssetSafe(index);

    // If asset is not available in buffer, return a placeholder
    if (asset == null) {
      return PhotoViewGalleryPageOptions.customChild(
        heroAttributes: PhotoViewHeroAttributes(tag: 'loading_$index'),
        child: Container(
          width: ctx.width,
          height: ctx.height,
          color: backgroundColor,
          child: const Center(child: CircularProgressIndicator()),
        ),
      );
    }

    BaseAsset displayAsset = asset;
    final stackChildren = ref.read(stackChildrenNotifier(asset)).valueOrNull;
    if (stackChildren != null && stackChildren.isNotEmpty) {
      displayAsset = stackChildren.elementAt(ref.read(assetViewerProvider).stackIndex);
    }

    final isPlayingMotionVideo = ref.read(isPlayingMotionVideoProvider);
    if (displayAsset.isImage && !isPlayingMotionVideo) {
      return _imageBuilder(ctx, displayAsset);
    }

    return _videoBuilder(ctx, displayAsset);
  }

  PhotoViewGalleryPageOptions _imageBuilder(BuildContext ctx, BaseAsset asset) {
    final size = ctx.sizeData;
    return PhotoViewGalleryPageOptions(
      key: ValueKey(asset.heroTag),
      imageProvider: getFullImageProvider(asset, size: size),
      heroAttributes: PhotoViewHeroAttributes(tag: '${asset.heroTag}_$heroOffset'),
      filterQuality: FilterQuality.high,
      tightMode: true,
      disableScaleGestures: showingBottomSheet,
      onDragStart: _onDragStart,
      onDragUpdate: _onDragUpdate,
      onDragEnd: _onDragEnd,
      onTapDown: _onTapDown,
      onLongPressStart: asset.isMotionPhoto ? _onLongPress : null,
      errorBuilder: (_, __, ___) => Container(
        width: size.width,
        height: size.height,
        color: backgroundColor,
        child: Thumbnail.fromAsset(asset: asset, fit: BoxFit.contain),
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
      heroAttributes: PhotoViewHeroAttributes(tag: '${asset.heroTag}_$heroOffset'),
      filterQuality: FilterQuality.high,
      maxScale: 1.0,
      basePosition: Alignment.center,
      disableScaleGestures: true,
      child: SizedBox(
        width: ctx.width,
        height: ctx.height,
        child: NativeVideoViewer(
          key: _getVideoPlayerKey(asset.heroTag),
          asset: asset,
          image: Image(
            key: ValueKey(asset),
            image: getFullImageProvider(asset, size: ctx.sizeData),
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
    ref.watch(assetViewerProvider.select((s) => s.backgroundOpacity));
    ref.watch(assetViewerProvider.select((s) => s.stackIndex));
    ref.watch(isPlayingMotionVideoProvider);
    final showingControls = ref.watch(assetViewerProvider.select((s) => s.showingControls));

    // Listen for casting changes and send initial asset to the cast provider
    ref.listen(castProvider.select((value) => value.isCasting), (_, isCasting) async {
      if (!isCasting) return;

      final asset = ref.read(currentAssetNotifier);
      if (asset == null) return;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleCasting();
      });
    });

    // Listen for control visibility changes and change system UI mode accordingly
    ref.listen(assetViewerProvider.select((value) => value.showingControls), (_, showingControls) async {
      if (showingControls) {
        unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge));
      } else {
        unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky));
      }
    });

    // debugPaintSizeEnabled = true;

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
        floatingActionButton: IgnorePointer(
          ignoring: !showingControls,
          child: AnimatedOpacity(
            opacity: showingControls ? 1.0 : 0.0,
            duration: Durations.short2,
            child: const DownloadStatusFloatingButton(),
          ),
        ),
        body: LayoutBuilder(
          builder: (context, constraints) {
            final viewportWidth = constraints.maxWidth;
            final viewportHeight = constraints.maxHeight;

            // Calculate image display height from asset dimensions
            final asset = ref.read(currentAssetNotifier);
            final assetWidth = asset?.width;
            final assetHeight = asset?.height;

            // should probably get this value from the actual size of the image
            // rather than calculating it. It could lead to very slight
            // misalignments.
            double imageHeight = viewportHeight;
            if (assetWidth != null && assetHeight != null && assetWidth > 0 && assetHeight > 0) {
              final aspectRatio = assetWidth / assetHeight;
              imageHeight = math.min(viewportWidth / aspectRatio, viewportHeight);
            }

            // Calculate padding to center the image in the viewport
            final topPadding = math.max((viewportHeight - imageHeight) / 2, 0.0);
            final snapOffset = math.max(topPadding + (imageHeight / 2), viewportHeight / 3 * 2);

            return Stack(
              clipBehavior: Clip.none,
              children: [
                NotificationListener<ScrollNotification>(
                  onNotification: onScrollNotification,
                  child: SingleChildScrollView(
                    controller: _scrollController,
                    physics: VariableHeightSnappingPhysics(snapStart: 0, snapEnd: snapOffset, snapOffset: snapOffset),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Container(
                        //   height: topPadding,
                        //   decoration: const BoxDecoration(color: Colors.green),
                        // ),
                        SizedOverflowBox(
                          size: Size(double.infinity, topPadding + imageHeight - (kMinInteractiveDimension / 2)),
                          alignment: Alignment.topCenter,
                          child: SizedBox(
                            height: viewportHeight,
                            child: PhotoViewGallery.builder(
                              gaplessPlayback: true,
                              loadingBuilder: _placeholderBuilder,
                              pageController: pageController,
                              scrollPhysics: CurrentPlatform.isIOS
                                  ? const FastScrollPhysics() // Use bouncing physics for iOS
                                  : const FastClampingScrollPhysics(), // Use heavy physics for Android
                              itemCount: totalAssets,
                              onPageChanged: _onPageChanged,
                              scaleStateChangedCallback: _onScaleStateChanged,
                              builder: _assetBuilder,
                              backgroundDecoration: BoxDecoration(color: backgroundColor),
                              enablePanAlways: true,
                            ),
                          ),
                        ),

                        // TODO: if zooming, this should be hidden, and we should
                        // probably disable the scroll physics
                        AnimatedOpacity(
                          opacity: _assetDetailsOpacity,
                          duration: kThemeAnimationDuration,
                          child: AssetDetails(minHeight: snapOffset),
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  height: viewportHeight,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [AssetStackRow(), ViewerBottomBar()],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class VariableHeightSnappingPhysics extends ScrollPhysics {
  final double snapStart;
  final double snapEnd;
  final double snapOffset;

  const VariableHeightSnappingPhysics({
    required this.snapStart,
    required this.snapEnd,
    required this.snapOffset,
    super.parent,
  });

  @override
  VariableHeightSnappingPhysics applyTo(ScrollPhysics? ancestor) {
    return VariableHeightSnappingPhysics(
      parent: buildParent(ancestor),
      snapStart: snapStart,
      snapEnd: snapEnd,
      snapOffset: snapOffset,
    );
  }

  @override
  double applyBoundaryConditions(ScrollMetrics position, double value) {
    if (value < position.pixels && position.pixels <= position.minScrollExtent) {
      return 0.0;
    }
    return super.applyBoundaryConditions(position, value);
  }

  @override
  Simulation? createBallisticSimulation(ScrollMetrics position, double velocity) {
    final tolerance = toleranceFor(position);

    if (position.pixels >= snapStart && position.pixels <= snapEnd) {
      double targetPixels;

      if (velocity < -tolerance.velocity) {
        targetPixels = 0;
      } else if (velocity > tolerance.velocity) {
        targetPixels = snapOffset;
      } else {
        targetPixels = (position.pixels < snapOffset / 2) ? 0 : snapOffset;
      }

      if ((position.pixels - targetPixels).abs() > tolerance.distance) {
        return ScrollSpringSimulation(spring, position.pixels, targetPixels, velocity, tolerance: tolerance);
      }
    }

    return super.createBallisticSimulation(position, velocity);
  }
}
