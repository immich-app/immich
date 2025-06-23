import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_sheet/bottom_sheet.dart';
import 'package:immich_mobile/presentation/widgets/images/full_image.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/utils/thumbnail_utils.dart';
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
      overrides: [
        timelineServiceProvider.overrideWithValue(timelineService),
      ],
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

class _AssetViewerState extends ConsumerState<AssetViewer> {
  late Platform platform;
  late PageController pageController;

  int totalAssets = 0;
  int backgroundOpacity = 255;
  bool shouldPopOnDrag = false;
  bool? hasDraggedDown;
  bool isSnapping = false;
  bool blockGestures = false;

  Offset dragDownPosition = Offset.zero;
  late PhotoViewControllerValue initialPhotoViewState;
  late DraggableScrollableController bottomSheetController;
  PersistentBottomSheetController? sheetCloseNotifier;
  // PhotoViewGallery takes care of disposing this controller
  PhotoViewControllerBase? viewController;
  bool showingBottomSheet = false;
  bool dragInProgress = false;

  @override
  void initState() {
    super.initState();
    pageController = PageController(initialPage: widget.initialIndex);
    platform = widget.platform ?? const LocalPlatform();
    totalAssets = ref.read(timelineServiceProvider).totalAssets;
    bottomSheetController = DraggableScrollableController();
    _onPageChanged(widget.initialIndex);
  }

  @override
  void dispose() {
    pageController.dispose();
    bottomSheetController.dispose();
    super.dispose();
  }

  Color get backgroundColor {
    if (showingBottomSheet && !context.isDarkTheme) {
      return Colors.white;
    }
    return Colors.black.withAlpha(backgroundOpacity);
  }

  Future<void> _precacheImage(int index) async {
    if (!context.mounted) {
      return;
    }

    if (index >= 0 && index < totalAssets) {
      final asset = ref.read(timelineServiceProvider).getAsset(index);
      await precacheImage(
        getFullImageProvider(
          asset,
          size: Size(
            context.width,
            context.height,
          ),
        ),
        context,
        onError: (_, __) {},
      );
    }
  }

  void _onPageChanged(int index) {
    // This will trigger the pre-caching of assets for the next and previous pages.
    // This ensures that the images are ready when the user navigates to them.
    ref.read(timelineServiceProvider).preCacheAssets(index).then((_) {
      unawaited(_precacheImage((index - 1).clamp(0, totalAssets - 1)));
      unawaited(_precacheImage((index + 1).clamp(0, totalAssets - 1)));

      final asset = ref.read(timelineServiceProvider).getAsset(index);
      ref.read(currentAssetNotifier.notifier).setAsset(asset);
    });
  }

  void _onDragStart(
    BuildContext _,
    DragStartDetails details,
    PhotoViewControllerBase controller,
  ) {
    dragDownPosition = details.localPosition;
    initialPhotoViewState = controller.value;
  }

  void _onDragEnd(
    BuildContext ctx,
    DragEndDetails _,
    PhotoViewControllerBase controller,
  ) {
    dragInProgress = false;
    if (shouldPopOnDrag) {
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

    setState(() {
      shouldPopOnDrag = false;
      hasDraggedDown = null;
      controller.animateMultiple(
        position: initialPhotoViewState.position,
        scale: initialPhotoViewState.scale,
        rotation: initialPhotoViewState.rotation,
      );
      backgroundOpacity = 255;
    });
  }

  void _onDragUpdate(
    BuildContext ctx,
    DragUpdateDetails details,
    PhotoViewControllerBase controller,
  ) {
    if (blockGestures) {
      return;
    }

    dragInProgress = true;
    final delta = details.localPosition - dragDownPosition;
    hasDraggedDown ??= delta.dy > 0;
    if (!hasDraggedDown! || showingBottomSheet) {
      _handleDragUp(ctx, delta, controller);
      return;
    }

    _handleDragDown(ctx, delta, controller);
  }

  void _handleDragUp(
    BuildContext ctx,
    Offset delta,
    PhotoViewControllerBase controller,
  ) {
    const double openThreshold = 50;
    const double closeThreshold = 25;

    final position = initialPhotoViewState.position + Offset(0, delta.dy);
    final distanceToOrigin = (Offset.zero - position).distance;

    if (showingBottomSheet && distanceToOrigin < closeThreshold) {
      controller.animateMultiple(position: Offset.zero);
      // Prevents the user from dragging the bottom sheet further down
      blockGestures = true;
      sheetCloseNotifier?.close();
      return;
    }

    controller.updateMultiple(position: position);
    if (showingBottomSheet && bottomSheetController.isAttached) {
      final centre = (ctx.height * _kBottomSheetMinimumExtent);
      bottomSheetController.jumpTo((centre + distanceToOrigin) / ctx.height);
    }

    if (distanceToOrigin > openThreshold && !showingBottomSheet) {
      setState(() {
        showingBottomSheet = true;
        sheetCloseNotifier = showBottomSheet(
          context: ctx,
          sheetAnimationStyle: AnimationStyle(
            duration: Duration.zero,
            reverseDuration: Duration.zero,
          ),
          builder: (_) {
            return NotificationListener<Notification>(
              onNotification: _onNotification,
              child: DraggableScrollableSheet(
                controller: bottomSheetController,
                initialChildSize: _kBottomSheetMinimumExtent,
                minChildSize: 0.1,
                maxChildSize: 1.0,
                expand: false,
                shouldCloseOnMinExtent: false,
                builder: (_, controller) {
                  return AssetDetailBottomSheet(
                    controller: controller,
                  );
                },
              ),
            );
          },
        );
        sheetCloseNotifier?.closed.then((_) {
          setState(() {
            showingBottomSheet = false;
            sheetCloseNotifier = null;
            controller.animateMultiple(position: Offset.zero);
            shouldPopOnDrag = false;
            hasDraggedDown = null;
          });
        });
      });
    }
  }

  bool _onNotification(Notification delta) {
    // Ignore notifications when user dragging the asset
    if (dragInProgress) {
      return false;
    }

    if (delta is DraggableScrollableNotification) {
      isSnapping = false;
      final verticalOffset = (context.height * delta.extent) -
          (context.height * _kBottomSheetMinimumExtent);
      if (verticalOffset > 0) {
        viewController?.position = Offset(0, -verticalOffset);
      } else if (showingBottomSheet) {
        sheetCloseNotifier?.close();
      }
    }

    // Handle sheet snap manually so that the it snaps only at 0.7 but not after
    // the isSnapping guard is to prevent the notification from recursively handling the
    // notification, eventually resulting in a heap overflow
    if (!isSnapping &&
        delta is ScrollEndNotification &&
        bottomSheetController.size < 0.7 &&
        bottomSheetController.size > 0.4) {
      isSnapping = true;
      bottomSheetController.animateTo(
        0.7,
        duration: Durations.short3,
        curve: Curves.easeOut,
      );
    }
    return false;
  }

  void _handleDragDown(
    BuildContext ctx,
    Offset delta,
    PhotoViewControllerBase controller,
  ) {
    const double dragRatio = 0.2;
    const double popThreshold = 180;

    final distance = delta.distance;
    shouldPopOnDrag = delta.dy > 0 && distance > popThreshold;

    final maxScaleDistance = ctx.height * 0.5;
    final scaleReduction = (distance / maxScaleDistance).clamp(0.0, dragRatio);
    double? updatedScale;
    if (initialPhotoViewState.scale != null) {
      updatedScale = initialPhotoViewState.scale! * (1.0 - scaleReduction);
    }

    setState(() {
      backgroundOpacity = (255 * (1.0 - (scaleReduction / dragRatio))).round();
      controller.updateMultiple(
        position: initialPhotoViewState.position + delta,
        scale: updatedScale,
      );
    });
  }

  Widget _placeholderBuilder(BuildContext ctx, _, int index) {
    final asset = ref.read(timelineServiceProvider).getAsset(index);
    return Hero(
      tag: '${asset.heroTag}_${getHeroOffset(ctx)}',
      child: Container(
        width: double.infinity,
        height: double.infinity,
        color: backgroundColor,
        child: Thumbnail(
          asset: asset,
          fit: BoxFit.contain,
        ),
      ),
    );
  }

  PhotoViewGalleryPageOptions _assetBuilder(BuildContext ctx, int index) {
    final asset = ref.read(timelineServiceProvider).getAsset(index);
    return PhotoViewGalleryPageOptions(
      imageProvider: getFullImageProvider(asset),
      heroAttributes: PhotoViewHeroAttributes(
        tag: '${asset.heroTag}_${getHeroOffset(ctx)}',
      ),
      filterQuality: FilterQuality.high,
      tightMode: true,
      initialScale: PhotoViewComputedScale.contained * 0.99,
      minScale: PhotoViewComputedScale.contained * 0.99,
      errorBuilder: (_, __, ___) => FullImage(
        asset,
        fit: BoxFit.contain,
        size: Size(
          ctx.width,
          ctx.height,
        ),
      ),
      onDragStart: _onDragStart,
      onDragUpdate: _onDragUpdate,
      onDragEnd: _onDragEnd,
    );
  }

  void _controllerChangedCallback(PhotoViewControllerBase? controller) {
    if (controller == null) {
      return;
    }

    viewController = controller;
    if (showingBottomSheet) {
      final verticalOffset = (context.height * bottomSheetController.size) -
          (context.height * _kBottomSheetMinimumExtent);
      viewController?.position = Offset(0, -verticalOffset);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Currently it is not possible to scroll the asset when the bottom sheet is open all the way.
      // Issue: https://github.com/flutter/flutter/issues/109037
      // TODO: Add a custom scrum builder once the fix lands on stable
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
        builder: _assetBuilder,
        backgroundDecoration: BoxDecoration(color: backgroundColor),
        enableRotation: true,
        enablePanAlways: true,
        controllerChangedCallback: _controllerChangedCallback,
      ),
    );
  }
}
