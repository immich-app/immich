import 'dart:io';
import 'package:easy_localization/easy_localization.dart';
import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/ui/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/advanced_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/modules/home/ui/delete_dialog.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/ui/immich_image.dart';
import 'package:immich_mobile/shared/ui/photo_view/photo_view_gallery.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/photo_view_computed_scale.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/photo_view_scale_state.dart';
import 'package:immich_mobile/shared/ui/photo_view/src/utils/photo_view_hero_attributes.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:openapi/api.dart' as api;

// ignore: must_be_immutable
class GalleryViewerPage extends HookConsumerWidget {
  final Asset Function(int index) loadAsset;
  final int totalAssets;
  final int initialIndex;

  GalleryViewerPage({
    super.key,
    required this.initialIndex,
    required this.loadAsset,
    required this.totalAssets,
  }) : controller = PageController(initialPage: initialIndex);

  final PageController controller;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsServiceProvider);
    final isLoadPreview = useState(AppSettingsEnum.loadPreview.defaultValue);
    final isLoadOriginal = useState(AppSettingsEnum.loadOriginal.defaultValue);
    final isZoomed = useState<bool>(false);
    final showAppBar = useState<bool>(true);
    final isPlayingMotionVideo = useState(false);
    final isPlayingVideo = useState(false);
    late Offset localPosition;
    final authToken = 'Bearer ${Store.get(StoreKey.accessToken)}';
    final currentIndex = useState(initialIndex);
    final currentAsset = loadAsset(currentIndex.value);
    final watchedAsset = ref.watch(assetDetailProvider(currentAsset));

    Asset asset() => watchedAsset.value ?? currentAsset;

    showAppBar.addListener(() {
      // Change to and from immersive mode, hiding navigation and app bar
      if (showAppBar.value) {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      } else {
        SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
      }
    });

    useEffect(
      () {
        isLoadPreview.value =
            settings.getSetting<bool>(AppSettingsEnum.loadPreview);
        isLoadOriginal.value =
            settings.getSetting<bool>(AppSettingsEnum.loadOriginal);
        isPlayingMotionVideo.value = false;
        return null;
      },
      [],
    );

    void toggleFavorite(Asset asset) => ref
        .watch(assetProvider.notifier)
        .toggleFavorite([asset], !asset.isFavorite);

    /// Thumbnail image of a remote asset. Required asset.isRemote
    ImageProvider remoteThumbnailImageProvider(
      Asset asset,
      api.ThumbnailFormat type,
    ) {
      return CachedNetworkImageProvider(
        getThumbnailUrl(
          asset,
          type: type,
        ),
        cacheKey: getThumbnailCacheKey(
          asset,
          type: type,
        ),
        headers: {"Authorization": authToken},
      );
    }

    /// Original (large) image of a remote asset. Required asset.isRemote
    ImageProvider originalImageProvider(Asset asset) {
      return CachedNetworkImageProvider(
        getImageUrl(asset),
        cacheKey: getImageCacheKey(asset),
        headers: {"Authorization": authToken},
      );
    }

    /// Thumbnail image of a local asset. Required asset.isLocal
    ImageProvider localThumbnailImageProvider(Asset asset) {
      return AssetEntityImageProvider(
        asset.local!,
        isOriginal: false,
        thumbnailSize: ThumbnailSize(
          MediaQuery.of(context).size.width.floor(),
          MediaQuery.of(context).size.height.floor(),
        ),
      );
    }

    /// Original (large) image of a local asset. Required asset.isLocal
    ImageProvider localImageProvider(Asset asset) {
      return AssetEntityImageProvider(
        isOriginal: true,
        asset.local!,
      );
    }

    void precacheNextImage(int index) {
      if (index < totalAssets && index >= 0) {
        final asset = loadAsset(index);

        if (asset.isLocal) {
          // Preload the local asset
          precacheImage(localImageProvider(asset), context);
        } else {
          onError(Object exception, StackTrace? stackTrace) {
            // swallow error silently
          }
          // Probably load WEBP either way
          precacheImage(
            remoteThumbnailImageProvider(
              asset,
              api.ThumbnailFormat.WEBP,
            ),
            context,
            onError: onError,
          );
          if (isLoadPreview.value) {
            // Precache the JPEG thumbnail
            precacheImage(
              remoteThumbnailImageProvider(
                asset,
                api.ThumbnailFormat.JPEG,
              ),
              context,
              onError: onError,
            );
          }
          if (isLoadOriginal.value) {
            // Preload the original asset
            precacheImage(
              originalImageProvider(asset),
              context,
              onError: onError,
            );
          }
        }
      }
    }

    void showInfo() {
      showModalBottomSheet(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15.0),
        ),
        barrierColor: Colors.transparent,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        context: context,
        builder: (context) {
          if (ref
              .watch(appSettingsServiceProvider)
              .getSetting<bool>(AppSettingsEnum.advancedTroubleshooting)) {
            return AdvancedBottomSheet(assetDetail: asset());
          }
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: ExifBottomSheet(asset: asset()),
          );
        },
      );
    }

    void handleDelete(Asset deleteAsset) {
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return DeleteDialog(
            onDelete: () {
              if (totalAssets == 1) {
                // Handle only one asset
                AutoRouter.of(context).pop();
              } else {
                // Go to next page otherwise
                controller.nextPage(
                  duration: const Duration(milliseconds: 100),
                  curve: Curves.fastLinearToSlowEaseIn,
                );
              }
              ref.watch(assetProvider.notifier).deleteAssets({deleteAsset});
            },
          );
        },
      );
    }

    void addToAlbum(Asset addToAlbumAsset) {
      showModalBottomSheet(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15.0),
        ),
        context: context,
        builder: (BuildContext _) {
          return AddToAlbumBottomSheet(
            assets: [addToAlbumAsset],
          );
        },
      );
    }

    void handleSwipeUpDown(DragUpdateDetails details) {
      int sensitivity = 15;
      int dxThreshold = 50;

      if (isZoomed.value) {
        return;
      }

      // Check for delta from initial down point
      final d = details.localPosition - localPosition;
      // If the magnitude of the dx swipe is large, we probably didn't mean to go down
      if (d.dx.abs() > dxThreshold) {
        return;
      }

      if (details.delta.dy > sensitivity) {
        AutoRouter.of(context).pop();
      } else if (details.delta.dy < -sensitivity) {
        showInfo();
      }
    }

    shareAsset() {
      ref.watch(imageViewerStateProvider.notifier).shareAsset(asset(), context);
    }

    handleArchive(Asset asset) {
      ref
          .watch(assetProvider.notifier)
          .toggleArchive([asset], !asset.isArchived);
      AutoRouter.of(context).pop();
    }

    buildAppBar() {
      final show = (showAppBar.value || // onTap has the final say
              (showAppBar.value && !isZoomed.value)) &&
          !isPlayingVideo.value;

      return IgnorePointer(
        ignoring: !show,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 100),
          opacity: show ? 1.0 : 0.0,
          child: Container(
            color: Colors.black.withOpacity(0.4),
            child: TopControlAppBar(
              isPlayingMotionVideo: isPlayingMotionVideo.value,
              asset: asset(),
              isFavorite: asset().isFavorite,
              onMoreInfoPressed: showInfo,
              onFavorite:
                  asset().isRemote ? () => toggleFavorite(asset()) : null,
              onDownloadPressed: asset().isLocal
                  ? null
                  : () => ref
                      .watch(imageViewerStateProvider.notifier)
                      .downloadAsset(
                        asset(),
                        context,
                      ),
              onToggleMotionVideo: (() {
                isPlayingMotionVideo.value = !isPlayingMotionVideo.value;
              }),
              onAddToAlbumPressed: () => addToAlbum(asset()),
            ),
          ),
        ),
      );
    }

    buildBottomBar() {
      final show = (showAppBar.value || // onTap has the final say
              (showAppBar.value && !isZoomed.value)) &&
          !isPlayingVideo.value;

      return IgnorePointer(
        ignoring: !show,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 100),
          opacity: show ? 1.0 : 0.0,
          child: BottomNavigationBar(
            backgroundColor: Colors.black.withOpacity(0.4),
            unselectedIconTheme: const IconThemeData(color: Colors.white),
            selectedIconTheme: const IconThemeData(color: Colors.white),
            unselectedLabelStyle: const TextStyle(color: Colors.black),
            selectedLabelStyle: const TextStyle(color: Colors.black),
            showSelectedLabels: false,
            showUnselectedLabels: false,
            items: [
              BottomNavigationBarItem(
                icon: const Icon(Icons.ios_share_rounded),
                label: 'control_bottom_app_bar_share'.tr(),
                tooltip: 'control_bottom_app_bar_share'.tr(),
              ),
              asset().isArchived
                  ? BottomNavigationBarItem(
                      icon: const Icon(Icons.unarchive_rounded),
                      label: 'control_bottom_app_bar_unarchive'.tr(),
                      tooltip: 'control_bottom_app_bar_unarchive'.tr(),
                    )
                  : BottomNavigationBarItem(
                      icon: const Icon(Icons.archive_outlined),
                      label: 'control_bottom_app_bar_archive'.tr(),
                      tooltip: 'control_bottom_app_bar_archive'.tr(),
                    ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.delete_outline),
                label: 'control_bottom_app_bar_delete'.tr(),
                tooltip: 'control_bottom_app_bar_delete'.tr(),
              ),
            ],
            onTap: (index) {
              switch (index) {
                case 0:
                  shareAsset();
                  break;
                case 1:
                  handleArchive(asset());
                  break;
                case 2:
                  handleDelete(asset());
                  break;
              }
            },
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: WillPopScope(
        onWillPop: () async {
          // Change immersive mode back to normal "edgeToEdge" mode
          await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
          return true;
        },
        child: Stack(
          children: [
            PhotoViewGallery.builder(
              scaleStateChangedCallback: (state) {
                isZoomed.value = state != PhotoViewScaleState.initial;
                showAppBar.value = !isZoomed.value;
              },
              pageController: controller,
              scrollPhysics: isZoomed.value
                  ? const NeverScrollableScrollPhysics() // Don't allow paging while scrolled in
                  : (Platform.isIOS
                      ? const ScrollPhysics() // Use bouncing physics for iOS
                      : const ClampingScrollPhysics() // Use heavy physics for Android
                  ),
              itemCount: totalAssets,
              scrollDirection: Axis.horizontal,
              onPageChanged: (value) {
                // Precache image
                if (currentIndex.value < value) {
                  // Moving forwards, so precache the next asset
                  precacheNextImage(value + 1);
                } else {
                  // Moving backwards, so precache previous asset
                  precacheNextImage(value - 1);
                }
                currentIndex.value = value;
                HapticFeedback.selectionClick();
              },
              loadingBuilder: isLoadPreview.value
                  ? (context, event) {
                      final a = asset();
                      if (!a.isLocal) {
                        // Use the WEBP Thumbnail as a placeholder for the JPEG thumbnail to achieve
                        // Three-Stage Loading (WEBP -> JPEG -> Original)
                        final webPThumbnail = CachedNetworkImage(
                          imageUrl: getThumbnailUrl(
                            a,
                            type: api.ThumbnailFormat.WEBP,
                          ),
                          cacheKey: getThumbnailCacheKey(
                            a,
                            type: api.ThumbnailFormat.WEBP,
                          ),
                          httpHeaders: {'Authorization': authToken},
                          progressIndicatorBuilder: (_, __, ___) =>
                              const Center(
                            child: ImmichLoadingIndicator(),
                          ),
                          fadeInDuration: const Duration(milliseconds: 0),
                          fit: BoxFit.contain,
                          errorWidget: (context, url, error) =>
                              const Icon(Icons.image_not_supported_outlined),
                        );

                        if (isLoadOriginal.value) {
                          // loading the preview in the loadingBuilder only
                          // makes sense if the original is loaded in the builder
                          return CachedNetworkImage(
                            imageUrl: getThumbnailUrl(
                              a,
                              type: api.ThumbnailFormat.JPEG,
                            ),
                            cacheKey: getThumbnailCacheKey(
                              a,
                              type: api.ThumbnailFormat.JPEG,
                            ),
                            httpHeaders: {'Authorization': authToken},
                            fit: BoxFit.contain,
                            fadeInDuration: const Duration(milliseconds: 0),
                            placeholder: (_, __) => webPThumbnail,
                            errorWidget: (_, __, ___) => webPThumbnail,
                          );
                        } else {
                          return webPThumbnail;
                        }
                      } else {
                        return Image(
                          image: localThumbnailImageProvider(a),
                          fit: BoxFit.contain,
                        );
                      }
                    }
                  : null,
              builder: (context, index) {
                final asset = loadAsset(index);
                if (asset.isImage && !isPlayingMotionVideo.value) {
                  // Show photo
                  final ImageProvider provider;
                  if (asset.isLocal) {
                    provider = localImageProvider(asset);
                  } else {
                    if (isLoadOriginal.value) {
                      provider = originalImageProvider(asset);
                    } else if (isLoadPreview.value) {
                      provider = remoteThumbnailImageProvider(
                        asset,
                        api.ThumbnailFormat.JPEG,
                      );
                    } else {
                      provider = remoteThumbnailImageProvider(
                        asset,
                        api.ThumbnailFormat.WEBP,
                      );
                    }
                  }
                  return PhotoViewGalleryPageOptions(
                    onDragStart: (_, details, __) =>
                        localPosition = details.localPosition,
                    onDragUpdate: (_, details, __) =>
                        handleSwipeUpDown(details),
                    onTapDown: (_, __, ___) =>
                        showAppBar.value = !showAppBar.value,
                    imageProvider: provider,
                    heroAttributes: PhotoViewHeroAttributes(
                      tag: asset.id,
                    ),
                    filterQuality: FilterQuality.high,
                    tightMode: true,
                    minScale: PhotoViewComputedScale.contained,
                    errorBuilder: (context, error, stackTrace) => ImmichImage(
                      asset,
                      fit: BoxFit.contain,
                    ),
                  );
                } else {
                  return PhotoViewGalleryPageOptions.customChild(
                    onDragStart: (_, details, __) =>
                        localPosition = details.localPosition,
                    onDragUpdate: (_, details, __) =>
                        handleSwipeUpDown(details),
                    heroAttributes: PhotoViewHeroAttributes(
                      tag: asset.id,
                    ),
                    filterQuality: FilterQuality.high,
                    maxScale: 1.0,
                    minScale: 1.0,
                    basePosition: Alignment.bottomCenter,
                    child: SafeArea(
                      child: VideoViewerPage(
                        onPlaying: () => isPlayingVideo.value = true,
                        onPaused: () => isPlayingVideo.value = false,
                        asset: asset,
                        isMotionVideo: isPlayingMotionVideo.value,
                        onVideoEnded: () {
                          if (isPlayingMotionVideo.value) {
                            isPlayingMotionVideo.value = false;
                          }
                        },
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
              child: buildAppBar(),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: buildBottomBar(),
            ),
          ],
        ),
      ),
    );
  }
}
