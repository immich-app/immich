import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'dart:ui' as ui;
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/image_providers/immich_remote_image_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/asset_stack.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/current_asset.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/show_controls.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/video_player_value_provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/advanced_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/bottom_gallery_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_sheet/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/gallery_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/shared/ui/immich_thumbnail.dart';
import 'package:immich_mobile/shared/ui/photo_view/photo_view_gallery.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/photo_view_computed_scale.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/photo_view_scale_state.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/utils/photo_view_hero_attributes.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart' show ThumbnailFormat;

@RoutePage()
// ignore: must_be_immutable
class GalleryViewerPage extends HookConsumerWidget {
  final Asset Function(int index) loadAsset;
  final int totalAssets;
  final int initialIndex;
  final int heroOffset;
  final bool showStack;

  GalleryViewerPage({
    super.key,
    required this.initialIndex,
    required this.loadAsset,
    required this.totalAssets,
    this.heroOffset = 0,
    this.showStack = false,
  }) : controller = PageController(initialPage: initialIndex);

  final PageController controller;

  static const jpeg = ThumbnailFormat.JPEG;
  static const webp = ThumbnailFormat.WEBP;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsServiceProvider);
    final isLoadPreview = useState(AppSettingsEnum.loadPreview.defaultValue);
    final isLoadOriginal = useState(AppSettingsEnum.loadOriginal.defaultValue);
    final isZoomed = useState(false);
    final isPlayingVideo = useState(false);
    final localPosition = useState<Offset?>(null);
    final currentIndex = useState(initialIndex);
    final currentAsset = loadAsset(currentIndex.value);
    // Update is playing motion video
    ref.listen(videoPlaybackValueProvider.select((v) => v.state), (_, state) {
      isPlayingVideo.value = state == VideoPlaybackState.playing;
    });

    final stackIndex = useState(-1);
    final stack = showStack && currentAsset.stackChildrenCount > 0
        ? ref.watch(assetStackStateProvider(currentAsset))
        : <Asset>[];
    final stackElements = showStack ? [currentAsset, ...stack] : <Asset>[];
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isFromDto = currentAsset.id == Isar.autoIncrement;

    Asset asset = stackIndex.value == -1
        ? currentAsset
        : stackElements.elementAt(stackIndex.value);

    final isMotionPhoto = asset.livePhotoVideoId != null;
    // Listen provider to prevent autoDispose when navigating to other routes from within the gallery page
    ref.listen(currentAssetProvider, (_, __) {});
    useEffect(
      () {
        // Delay state update to after the execution of build method
        Future.microtask(
          () => ref.read(currentAssetProvider.notifier).set(asset),
        );
        return null;
      },
      [asset],
    );

    useEffect(
      () {
        isLoadPreview.value =
            settings.getSetting<bool>(AppSettingsEnum.loadPreview);
        isLoadOriginal.value =
            settings.getSetting<bool>(AppSettingsEnum.loadOriginal);
        return null;
      },
      [],
    );

    Future<void> precacheNextImage(int index) async {
      void onError(Object exception, StackTrace? stackTrace) {
        // swallow error silently
        debugPrint('Error precaching next image: $exception, $stackTrace');
      }

      if (index < totalAssets && index >= 0) {
        final asset = loadAsset(index);
        await precacheImage(
          ImmichImage.imageProvider(asset: asset),
          context,
          onError: onError,
        );
      }
    }

    void showInfo() {
      showModalBottomSheet(
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(15.0)),
        ),
        barrierColor: Colors.transparent,
        isScrollControlled: true,
        showDragHandle: true,
        enableDrag: true,
        context: context,
        useSafeArea: true,
        builder: (context) {
          return FractionallySizedBox(
            heightFactor: 0.75,
            child: Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.viewInsetsOf(context).bottom,
              ),
              child: ref
                      .watch(appSettingsServiceProvider)
                      .getSetting<bool>(AppSettingsEnum.advancedTroubleshooting)
                  ? AdvancedBottomSheet(assetDetail: asset)
                  : ExifBottomSheet(asset: asset),
            ),
          );
        },
      );
    }

    void handleSwipeUpDown(DragUpdateDetails details) {
      const int sensitivity = 15;
      const int dxThreshold = 50;
      const double ratioThreshold = 3.0;

      if (isZoomed.value) {
        return;
      }

      // Guard [localPosition] null
      if (localPosition.value == null) {
        return;
      }

      // Check for delta from initial down point
      final d = details.localPosition - localPosition.value!;
      // If the magnitude of the dx swipe is large, we probably didn't mean to go down
      if (d.dx.abs() > dxThreshold) {
        return;
      }

      final ratio = d.dy / max(d.dx.abs(), 1);
      if (d.dy > sensitivity && ratio > ratioThreshold) {
        context.popRoute();
      } else if (d.dy < -sensitivity && ratio < -ratioThreshold) {
        showInfo();
      }
    }

    useEffect(
      () {
        if (ref.read(showControlsProvider)) {
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        } else {
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
        }
        isPlayingVideo.value = false;
        return null;
      },
      [],
    );

    useEffect(
      () {
        // No need to await this
        unawaited(
          // Delay this a bit so we can finish loading the page
          Future.delayed(const Duration(milliseconds: 400)).then(
            // Precache the next image
            (_) => precacheNextImage(currentIndex.value + 1),
          ),
        );
        return null;
      },
      [],
    );

    ref.listen(showControlsProvider, (_, show) {
      if (show) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      } else {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      }
    });

    Widget buildStackedChildren() {
      return ListView.builder(
        shrinkWrap: true,
        scrollDirection: Axis.horizontal,
        itemCount: stackElements.length,
        padding: const EdgeInsets.only(
          left: 5,
          right: 5,
          bottom: 30,
        ),
        itemBuilder: (context, index) {
          final assetId = stackElements.elementAt(index).remoteId;
          return Padding(
            padding: const EdgeInsets.only(right: 5),
            child: GestureDetector(
              onTap: () => stackIndex.value = index,
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: (stackIndex.value == -1 && index == 0) ||
                          index == stackIndex.value
                      ? Border.all(
                          color: Colors.white,
                          width: 2,
                        )
                      : null,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Image(
                    fit: BoxFit.cover,
                    image: ImmichRemoteImageProvider(assetId: assetId!),
                  ),
                ),
              ),
            ),
          );
        },
      );
    }

    return PopScope(
      canPop: false,
      onPopInvoked: (_) {
        // Change immersive mode back to normal "edgeToEdge" mode
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        context.pop();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            PhotoViewGallery.builder(
              scaleStateChangedCallback: (state) {
                isZoomed.value = state != PhotoViewScaleState.initial;
                ref.read(showControlsProvider.notifier).show = !isZoomed.value;
              },
              loadingBuilder: (context, event, index) => ClipRect(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    BackdropFilter(
                      filter: ui.ImageFilter.blur(
                        sigmaX: 10,
                        sigmaY: 10,
                      ),
                    ),
                    ImmichThumbnail(
                      asset: asset,
                      fit: BoxFit.contain,
                    ),
                  ],
                ),
              ),
              pageController: controller,
              scrollPhysics: isZoomed.value
                  ? const NeverScrollableScrollPhysics() // Don't allow paging while scrolled in
                  : (Platform.isIOS
                      ? const ScrollPhysics() // Use bouncing physics for iOS
                      : const ClampingScrollPhysics() // Use heavy physics for Android
                  ),
              itemCount: totalAssets,
              scrollDirection: Axis.horizontal,
              onPageChanged: (value) async {
                final next = currentIndex.value < value ? value + 1 : value - 1;

                ref.read(hapticFeedbackProvider.notifier).selectionClick();

                currentIndex.value = value;
                stackIndex.value = -1;
                isPlayingVideo.value = false;

                // Wait for page change animation to finish
                await Future.delayed(const Duration(milliseconds: 400));
                // Then precache the next image
                unawaited(precacheNextImage(next));
              },
              builder: (context, index) {
                final a =
                    index == currentIndex.value ? asset : loadAsset(index);
                final ImageProvider provider =
                    ImmichImage.imageProvider(asset: a);

                if (a.isImage && !isPlayingVideo.value) {
                  return PhotoViewGalleryPageOptions(
                    onDragStart: (_, details, __) =>
                        localPosition.value = details.localPosition,
                    onDragUpdate: (_, details, __) =>
                        handleSwipeUpDown(details),
                    onTapDown: (_, __, ___) {
                      ref.read(showControlsProvider.notifier).toggle();
                    },
                    imageProvider: provider,
                    heroAttributes: PhotoViewHeroAttributes(
                      tag: isFromDto
                          ? '${currentAsset.remoteId}-$heroOffset'
                          : currentAsset.id + heroOffset,
                      transitionOnUserGestures: true,
                    ),
                    filterQuality: FilterQuality.high,
                    tightMode: true,
                    minScale: PhotoViewComputedScale.contained,
                    errorBuilder: (context, error, stackTrace) => ImmichImage(
                      a,
                      fit: BoxFit.contain,
                    ),
                  );
                } else {
                  return PhotoViewGalleryPageOptions.customChild(
                    onDragStart: (_, details, __) =>
                        localPosition.value = details.localPosition,
                    onDragUpdate: (_, details, __) =>
                        handleSwipeUpDown(details),
                    heroAttributes: PhotoViewHeroAttributes(
                      tag: isFromDto
                          ? '${currentAsset.remoteId}-$heroOffset'
                          : currentAsset.id + heroOffset,
                    ),
                    filterQuality: FilterQuality.high,
                    maxScale: 1.0,
                    minScale: 1.0,
                    basePosition: Alignment.center,
                    child: VideoViewerPage(
                      key: ValueKey(a),
                      asset: a,
                      isMotionVideo: a.livePhotoVideoId != null,
                      placeholder: Image(
                        image: provider,
                        fit: BoxFit.contain,
                        height: context.height,
                        width: context.width,
                        alignment: Alignment.center,
                      ),
                    ),
                  );
                }
              },
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: GalleryAppBar(
                asset: asset,
                showInfo: showInfo,
                isPlayingVideo: isPlayingVideo.value,
                onToggleMotionVideo: () =>
                    isPlayingVideo.value = !isPlayingVideo.value,
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  Visibility(
                    visible: stack.isNotEmpty,
                    child: SizedBox(
                      height: 80,
                      child: buildStackedChildren(),
                    ),
                  ),
                  BottomGalleryBar(
                    totalAssets: totalAssets,
                    controller: controller,
                    showStack: showStack,
                    stackIndex: stackIndex.value,
                    asset: asset,
                    showVideoPlayerControls: !asset.isImage && !isMotionPhoto,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
