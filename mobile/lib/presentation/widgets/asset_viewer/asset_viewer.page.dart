import 'dart:async';

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
import 'package:immich_mobile/presentation/widgets/asset_viewer/activities_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_stack.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet.widget.dart';
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
      // Hide controls by default for videos and motion photos
      ref.read(assetViewerProvider.notifier).setControls(false);
    }
  }
}

const double _kBottomSheetMinimumExtent = 0.4;
const double _kBottomSheetSnapExtent = 0.67;

class _AssetViewerState extends ConsumerState<AssetViewer> {
  static final _dummyListener = ImageStreamListener((image, _) => image.dispose());
  late PageController pageController;
  late DraggableScrollableController bottomSheetController;
  PersistentBottomSheetController? sheetCloseController;
  // PhotoViewGallery takes care of disposing it's controllers
  PhotoViewControllerBase? viewController;
  StreamSubscription? reloadSubscription;

  late final int heroOffset;
  late PhotoViewControllerValue initialPhotoViewState;
  bool? hasDraggedDown;
  bool isSnapping = false;
  bool blockGestures = false;
  bool dragInProgress = false;
  bool shouldPopOnDrag = false;
  bool assetReloadRequested = false;
  double? initialScale;
  double previousExtent = _kBottomSheetMinimumExtent;
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

  @override
  void initState() {
    super.initState();
    assert(ref.read(currentAssetNotifier) != null, "Current asset should not be null when opening the AssetViewer");
    pageController = PageController(initialPage: widget.initialIndex);
    totalAssets = ref.read(timelineServiceProvider).totalAssets;
    bottomSheetController = DraggableScrollableController();
    WidgetsBinding.instance.addPostFrameCallback(_onAssetInit);
    reloadSubscription = EventStream.shared.listen(_onEvent);
    heroOffset = widget.heroOffset ?? TabsRouterScope.of(context)?.controller.activeIndex ?? 0;
    final asset = ref.read(currentAssetNotifier);
    if (asset != null) {
      _stackChildrenKeepAlive = ref.read(stackChildrenNotifier(asset).notifier).ref.keepAlive();
    }
  }

  @override
  void dispose() {
    pageController.dispose();
    bottomSheetController.dispose();
    _cancelTimers();
    reloadSubscription?.cancel();
    _prevPreCacheStream?.removeListener(_dummyListener);
    _nextPreCacheStream?.removeListener(_dummyListener);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _stackChildrenKeepAlive?.close();
    super.dispose();
  }

  bool get showingBottomSheet => ref.read(assetViewerProvider.select((s) => s.showingBottomSheet));

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

  double _getVerticalOffsetForBottomSheet(double extent) =>
      (context.height * extent) - (context.height * _kBottomSheetMinimumExtent);

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

  void _onPageBuild(PhotoViewControllerBase controller) {
    viewController ??= controller;
    if (showingBottomSheet && bottomSheetController.isAttached) {
      final verticalOffset =
          (context.height * bottomSheetController.size) - (context.height * _kBottomSheetMinimumExtent);
      controller.position = Offset(0, -verticalOffset);
      // Apply the zoom effect when the bottom sheet is showing
      initialScale = controller.scale;
      controller.scale = (controller.scale ?? 1.0) + 0.01;
    }
  }

  void _onPageChanged(int index, PhotoViewControllerBase? controller) {
    _onAssetChanged(index);
    viewController = controller;
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

    if (distanceToOrigin > openThreshold && !showingBottomSheet && !ref.read(readonlyModeProvider)) {
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

    final backgroundOpacity = (255 * (1.0 - (scaleReduction / dragRatio))).round();

    viewController?.updateMultiple(position: initialPhotoViewState.position + delta, scale: updatedScale);
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
    if (isDraggingDown && delta.extent < 0.67) {
      if (dragInProgress) {
        blockGestures = true;
      }
      // Jump to a lower position before starting close animation to prevent glitch
      if (bottomSheetController.isAttached) {
        bottomSheetController.jumpTo(0.67);
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
      _onTimelineReloadEvent();
      return;
    }

    if (event is ViewerReloadAssetEvent) {
      assetReloadRequested = true;
      return;
    }

    if (event is ViewerOpenBottomSheetEvent) {
      final extent = _kBottomSheetMinimumExtent + 0.3;
      _openBottomSheet(scaffoldContext!, extent: extent, activitiesMode: event.activitiesMode);
      final offset = _getVerticalOffsetForBottomSheet(extent);
      viewController?.position = Offset(0, -offset);
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
      sheetCloseController?.close();
    });
  }

  void _openBottomSheet(BuildContext ctx, {double extent = _kBottomSheetMinimumExtent, bool activitiesMode = false}) {
    ref.read(assetViewerProvider.notifier).setBottomSheet(true);
    initialScale = viewController?.scale;
    // viewController?.updateMultiple(scale: (viewController?.scale ?? 1.0) + 0.01);
    previousExtent = _kBottomSheetMinimumExtent;
    sheetCloseController = showBottomSheet(
      context: ctx,
      sheetAnimationStyle: const AnimationStyle(duration: Durations.medium2, reverseDuration: Durations.medium2),
      constraints: const BoxConstraints(maxWidth: double.infinity),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20.0))),
      backgroundColor: ctx.colorScheme.surfaceContainerLowest,
      builder: (_) {
        return NotificationListener<Notification>(
          onNotification: _onNotification,
          child: activitiesMode
              ? ActivitiesBottomSheet(controller: bottomSheetController, initialChildSize: extent)
              : AssetDetailBottomSheet(controller: bottomSheetController, initialChildSize: extent),
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
    if (!bottomSheetController.isAttached ||
        bottomSheetController.size > _kBottomSheetSnapExtent ||
        bottomSheetController.size < 0.4) {
      return;
    }
    isSnapping = true;
    bottomSheetController.animateTo(_kBottomSheetSnapExtent, duration: Durations.short3, curve: Curves.easeOut);
  }

  Widget _placeholderBuilder(BuildContext ctx, ImageChunkEvent? progress, int index) {
    return const Center(child: ImmichLoadingIndicator());
  }

  void _onScaleStateChanged(PhotoViewScaleState scaleState) {
    if (scaleState != PhotoViewScaleState.initial) {
      ref.read(assetViewerProvider.notifier).setControls(false);
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
    ref.watch(assetViewerProvider.select((s) => s.showingBottomSheet));
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
        body: Stack(
          children: [
            PhotoViewGallery.builder(
              gaplessPlayback: true,
              loadingBuilder: _placeholderBuilder,
              pageController: pageController,
              scrollPhysics: CurrentPlatform.isIOS
                  ? const FastScrollPhysics() // Use bouncing physics for iOS
                  : const FastClampingScrollPhysics(), // Use heavy physics for Android
              itemCount: totalAssets,
              onPageChanged: _onPageChanged,
              onPageBuild: _onPageBuild,
              scaleStateChangedCallback: _onScaleStateChanged,
              builder: _assetBuilder,
              backgroundDecoration: BoxDecoration(color: backgroundColor),
              enablePanAlways: true,
            ),
            if (!showingBottomSheet)
              const Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [AssetStackRow(), ViewerBottomBar()],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
