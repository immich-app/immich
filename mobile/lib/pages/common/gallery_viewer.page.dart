import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'dart:ui' as ui;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/pages/common/download_panel.dart';
import 'package:immich_mobile/pages/common/native_video_viewer.page.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/image/immich_remote_image_provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/asset_viewer/advanced_bottom_sheet.dart';
import 'package:immich_mobile/widgets/asset_viewer/bottom_gallery_bar.dart';
import 'package:immich_mobile/widgets/asset_viewer/detail_panel/detail_panel.dart';
import 'package:immich_mobile/widgets/asset_viewer/gallery_app_bar.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view_gallery.dart';
import 'package:immich_mobile/widgets/photo_view/src/photo_view_computed_scale.dart';
import 'package:immich_mobile/widgets/photo_view/src/photo_view_scale_state.dart';
import 'package:immich_mobile/widgets/photo_view/src/utils/photo_view_hero_attributes.dart';

@RoutePage()
// ignore: must_be_immutable
class GalleryViewerPage extends HookConsumerWidget {
  final int initialIndex;
  final int heroOffset;
  final bool showStack;
  final RenderList renderList;

  GalleryViewerPage({
    super.key,
    required this.renderList,
    this.initialIndex = 0,
    this.heroOffset = 0,
    this.showStack = false,
  }) : controller = PageController(initialPage: initialIndex);

  final PageController controller;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalAssets = useState(renderList.totalAssets);
    final isZoomed = useState(false);
    final isPlayingMotionVideo = useState(false);
    final stackIndex = useState(-1);
    final localPosition = useRef<Offset?>(null);
    final currentIndex = useValueNotifier(initialIndex);
    final loadAsset = renderList.loadAsset;
    final currentAsset = loadAsset(currentIndex.value);

    final stack = showStack && currentAsset.stackCount > 0
        ? ref.watch(assetStackStateProvider(currentAsset))
        : <Asset>[];
    final stackElements = showStack ? [currentAsset, ...stack] : <Asset>[];
    // Assets from response DTOs do not have an isar id, querying which would give us the default autoIncrement id
    final isFromDto = currentAsset.id == noDbId;

    Asset asset = stackIndex.value == -1
        ? currentAsset
        : stackElements.elementAt(stackIndex.value);

    // // Update is playing motion video
    if (asset.isMotionPhoto) {
      ref.listen(
          videoPlaybackValueProvider.select(
            (playback) => playback.state == VideoPlaybackState.playing,
          ), (wasPlaying, isPlaying) {
        if (wasPlaying != null && wasPlaying && !isPlaying) {
          isPlayingMotionVideo.value = false;
        }
      });
    }

    Future<void> precacheNextImage(int index) async {
      if (!context.mounted) {
        return;
      }

      void onError(Object exception, StackTrace? stackTrace) {
        // swallow error silently
        debugPrint('Error precaching next image: $exception, $stackTrace');
      }

      try {
        if (index < totalAssets.value && index >= 0) {
          log.info('Precaching next image at index $index');
          final asset = loadAsset(index);
          await precacheImage(
            ImmichImage.imageProvider(asset: asset),
            context,
            onError: onError,
          );
        }
      } catch (e) {
        // swallow error silently
        debugPrint('Error precaching next image: $e');
        context.maybePop();
      }
    }

    // Listen provider to prevent autoDispose when navigating to other routes from within the gallery page
    ref.listen(currentAssetProvider, (prev, cur) {
      log.info('Current asset changed from ${prev?.id} to ${cur?.id}');
    });

    useEffect(() {
      ref.read(currentAssetProvider.notifier).set(asset);
      if (ref.read(showControlsProvider)) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      } else {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      }

      // Delay this a bit so we can finish loading the page
      Timer(const Duration(milliseconds: 400), () {
        precacheNextImage(currentIndex.value + 1);
      });

      return null;
    });

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
                  : DetailPanel(asset: asset),
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
        context.maybePop();
      } else if (d.dy < -sensitivity && ratio < -ratioThreshold) {
        showInfo();
      }
    }

    ref.listen(showControlsProvider, (_, show) {
      if (show) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      } else {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      }
    });

    Widget buildStackedChildren() {
      if (!showStack) {
        return const SizedBox();
      }

      return ListView.builder(
        key: ValueKey(currentAsset),
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
          if (assetId == null) {
            return const SizedBox();
          }
          return Padding(
            key: ValueKey(assetId),
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
                    image: ImmichRemoteImageProvider(assetId: assetId),
                  ),
                ),
              ),
            ),
          );
        },
      );
    }

    Object getHeroTag(Asset asset) {
      return isFromDto
          ? '${asset.remoteId}-$heroOffset'
          : asset.id + heroOffset;
    }

    PhotoViewGalleryPageOptions buildImage(BuildContext context, Asset asset) {
      return PhotoViewGalleryPageOptions(
        onDragStart: (_, details, __) {
          localPosition.value = details.localPosition;
        },
        onDragUpdate: (_, details, __) {
          handleSwipeUpDown(details);
        },
        onTapDown: (_, __, ___) {
          ref.read(showControlsProvider.notifier).toggle();
        },
        onLongPressStart: (_, __, ___) {
          if (asset.livePhotoVideoId != null) {
            isPlayingMotionVideo.value = true;
          }
        },
        imageProvider: ImmichImage.imageProvider(asset: asset),
        heroAttributes: PhotoViewHeroAttributes(
          tag: getHeroTag(asset),
          transitionOnUserGestures: true,
        ),
        filterQuality: FilterQuality.high,
        tightMode: true,
        minScale: PhotoViewComputedScale.contained,
        errorBuilder: (context, error, stackTrace) => ImmichImage(
          asset,
          fit: BoxFit.contain,
        ),
      );
    }

    PhotoViewGalleryPageOptions buildVideo(BuildContext context, Asset asset) {
      final key = GlobalKey();
      final tag = getHeroTag(asset);
      return PhotoViewGalleryPageOptions.customChild(
        onDragStart: (_, details, __) =>
            localPosition.value = details.localPosition,
        onDragUpdate: (_, details, __) => handleSwipeUpDown(details),
        heroAttributes: PhotoViewHeroAttributes(
          tag: tag,
          transitionOnUserGestures: true,
        ),
        filterQuality: FilterQuality.high,
        initialScale: 1.0,
        maxScale: 1.0,
        minScale: 1.0,
        basePosition: Alignment.center,
        child: Hero(
          tag: tag,
          child: SizedBox(
            width: context.width,
            height: context.height,
            child: NativeVideoViewerPage(
              key: key,
              asset: asset,
              placeholder: Image(
                key: ValueKey(asset),
                image: ImmichImage.imageProvider(asset: asset),
                fit: BoxFit.contain,
                height: context.height,
                width: context.width,
                alignment: Alignment.center,
              ),
            ),
          ),
        ),
      );
    }

    PhotoViewGalleryPageOptions buildAsset(BuildContext context, int index) {
      final newAsset = index == currentIndex.value ? asset : loadAsset(index);

      if (newAsset.isImage) {
        ref.read(showControlsProvider.notifier).show = false;
      }

      if (newAsset.isImage && !isPlayingMotionVideo.value) {
        return buildImage(context, newAsset);
      }
      log.info('Loading asset ${newAsset.id} (index $index) as video');
      return buildVideo(context, newAsset);
    }

    return PopScope(
      // Change immersive mode back to normal "edgeToEdge" mode
      onPopInvokedWithResult: (didPop, _) =>
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge),
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            PhotoViewGallery.builder(
              key: ValueKey(asset),
              scaleStateChangedCallback: (state) {
                isZoomed.value = state != PhotoViewScaleState.initial;
                ref.read(showControlsProvider.notifier).show = !isZoomed.value;
              },
              // wantKeepAlive: true,
              gaplessPlayback: true,
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
                      key: ValueKey(asset),
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
                      ? const FastScrollPhysics() // Use bouncing physics for iOS
                      : const FastClampingScrollPhysics() // Use heavy physics for Android
                  ),
              itemCount: totalAssets.value,
              scrollDirection: Axis.horizontal,
              onPageChanged: (value) {
                log.info('Page changed to $value');
                final next = currentIndex.value < value ? value + 1 : value - 1;

                ref.read(hapticFeedbackProvider.notifier).selectionClick();

                final newAsset =
                    value == currentIndex.value ? asset : loadAsset(value);
                if (!newAsset.isImage || newAsset.isMotionPhoto) {
                  ref.read(videoPlaybackValueProvider.notifier).reset();
                }

                currentIndex.value = value;
                stackIndex.value = -1;
                isPlayingMotionVideo.value = false;

                // Delay setting the new asset to avoid a stutter in the page change animation
                // TODO: make the scroll animation finish more quickly, and ideally have a callback for when it's done
                ref.read(currentAssetProvider.notifier).set(newAsset);
                // Timer(const Duration(milliseconds: 450), () {
                // ref.read(currentAssetProvider.notifier).set(newAsset);
                // });

                // Wait for page change animation to finish, then precache the next image
                Timer(const Duration(milliseconds: 400), () {
                  precacheNextImage(next);
                });
              },
              builder: buildAsset,
            ),
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: GalleryAppBar(
                asset: asset,
                showInfo: showInfo,
                isPlayingVideo: isPlayingMotionVideo.value,
                onToggleMotionVideo: () =>
                    isPlayingMotionVideo.value = !isPlayingMotionVideo.value,
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
                    renderList: renderList,
                    totalAssets: totalAssets,
                    controller: controller,
                    showStack: showStack,
                    stackIndex: stackIndex.value,
                    asset: asset,
                    assetIndex: currentIndex,
                    showVideoPlayerControls:
                        !asset.isImage && !asset.isMotionPhoto,
                  ),
                ],
              ),
            ),
            const DownloadPanel(),
          ],
        ),
      ),
    );
  }
}
