import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'dart:ui' as ui;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/scroll_extensions.dart';
import 'package:immich_mobile/pages/common/download_panel.dart';
import 'package:immich_mobile/pages/common/gallery_stacked_children.dart';
import 'package:immich_mobile/pages/common/native_video_viewer.page.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_stack.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
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
/// Expects [currentAssetProvider] to be set before navigating to this page
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
    final stackIndex = useState(0);
    final localPosition = useRef<Offset?>(null);
    final currentIndex = useValueNotifier(initialIndex);
    final loadAsset = renderList.loadAsset;
    final isPlayingMotionVideo = ref.watch(isPlayingMotionVideoProvider);

    final videoPlayerKeys = useRef<Map<int, GlobalKey>>({});

    GlobalKey getVideoPlayerKey(int id) {
      videoPlayerKeys.value.putIfAbsent(id, () => GlobalKey());
      return videoPlayerKeys.value[id]!;
    }

    Future<void> precacheNextImage(int index) async {
      if (!context.mounted) {
        return;
      }

      void onError(Object exception, StackTrace? stackTrace) {
        // swallow error silently
        log.severe('Error precaching next image: $exception, $stackTrace');
      }

      try {
        if (index < totalAssets.value && index >= 0) {
          final asset = loadAsset(index);
          await precacheImage(
            ImmichImage.imageProvider(
              asset: asset,
              width: context.width,
              height: context.height,
            ),
            context,
            onError: onError,
          );
        }
      } catch (e) {
        // swallow error silently
        log.severe('Error precaching next image: $e');
        context.maybePop();
      }
    }

    useEffect(
      () {
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
      },
      const [],
    );

    void showInfo() {
      final asset = ref.read(currentAssetProvider);
      if (asset == null) {
        return;
      }
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
          return DraggableScrollableSheet(
            minChildSize: 0.5,
            maxChildSize: 1,
            initialChildSize: 0.75,
            expand: false,
            builder: (context, scrollController) {
              return Padding(
                padding: EdgeInsets.only(
                  bottom: context.viewInsets.bottom,
                ),
                child: ref.watch(appSettingsServiceProvider).getSetting<bool>(
                          AppSettingsEnum.advancedTroubleshooting,
                        )
                    ? AdvancedBottomSheet(
                        assetDetail: asset,
                        scrollController: scrollController,
                      )
                    : DetailPanel(
                        asset: asset,
                        scrollController: scrollController,
                      ),
              );
            },
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
      if (show || Platform.isIOS) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        return;
      }

      // This prevents the bottom bar from "dropping" while the controls are being hidden
      Timer(const Duration(milliseconds: 100), () {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      });
    });

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
        onLongPressStart: asset.isMotionPhoto
            ? (_, __, ___) {
                ref.read(isPlayingMotionVideoProvider.notifier).playing = true;
              }
            : null,
        imageProvider: ImmichImage.imageProvider(asset: asset),
        heroAttributes: _getHeroAttributes(asset),
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
      return PhotoViewGalleryPageOptions.customChild(
        onDragStart: (_, details, __) =>
            localPosition.value = details.localPosition,
        onDragUpdate: (_, details, __) => handleSwipeUpDown(details),
        heroAttributes: _getHeroAttributes(asset),
        filterQuality: FilterQuality.high,
        initialScale: 1.0,
        maxScale: 1.0,
        minScale: 1.0,
        basePosition: Alignment.center,
        child: SizedBox(
          width: context.width,
          height: context.height,
          child: NativeVideoViewerPage(
            key: getVideoPlayerKey(asset.id),
            asset: asset,
            image: Image(
              key: ValueKey(asset),
              image: ImmichImage.imageProvider(
                asset: asset,
                width: context.width,
                height: context.height,
              ),
              fit: BoxFit.contain,
              height: context.height,
              width: context.width,
              alignment: Alignment.center,
            ),
          ),
        ),
      );
    }

    PhotoViewGalleryPageOptions buildAsset(BuildContext context, int index) {
      var newAsset = loadAsset(index);

      final stackId = newAsset.stackId;
      if (stackId != null && currentIndex.value == index) {
        final stackElements =
            ref.read(assetStackStateProvider(newAsset.stackId!));
        if (stackIndex.value < stackElements.length) {
          newAsset = stackElements.elementAt(stackIndex.value);
        }
      }

      if (newAsset.isImage && !isPlayingMotionVideo) {
        return buildImage(context, newAsset);
      }
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
              key: const ValueKey('gallery'),
              scaleStateChangedCallback: (state) {
                final asset = ref.read(currentAssetProvider);
                if (asset == null) {
                  return;
                }

                if (asset.isImage && !ref.read(isPlayingMotionVideoProvider)) {
                  isZoomed.value = state != PhotoViewScaleState.initial;
                  ref.read(showControlsProvider.notifier).show =
                      !isZoomed.value;
                }
              },
              gaplessPlayback: true,
              loadingBuilder: (context, event, index) {
                final asset = loadAsset(index);
                return ClipRect(
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
                );
              },
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
                final next = currentIndex.value < value ? value + 1 : value - 1;

                ref.read(hapticFeedbackProvider.notifier).selectionClick();

                final newAsset = loadAsset(value);

                currentIndex.value = value;
                stackIndex.value = 0;

                ref.read(currentAssetProvider.notifier).set(newAsset);
                if (newAsset.isVideo || newAsset.isMotionPhoto) {
                  ref.read(videoPlaybackValueProvider.notifier).reset();
                }

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
                key: const ValueKey('app-bar'),
                showInfo: showInfo,
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  GalleryStackedChildren(stackIndex),
                  BottomGalleryBar(
                    key: const ValueKey('bottom-bar'),
                    renderList: renderList,
                    totalAssets: totalAssets,
                    controller: controller,
                    showStack: showStack,
                    stackIndex: stackIndex,
                    assetIndex: currentIndex,
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

  @pragma('vm:prefer-inline')
  PhotoViewHeroAttributes _getHeroAttributes(Asset asset) {
    return PhotoViewHeroAttributes(
      tag: asset.isInDb
          ? asset.id + heroOffset
          : '${asset.remoteId}-$heroOffset',
      transitionOnUserGestures: true,
    );
  }
}
