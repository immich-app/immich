import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/ui/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/favorite/providers/favorite_provider.dart';
import 'package:immich_mobile/shared/services/asset.service.dart';
import 'package:immich_mobile/modules/home/ui/delete_dialog.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
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
  late List<Asset> assetList;
  final Asset asset;

  GalleryViewerPage({
    Key? key,
    required this.assetList,
    required this.asset,
  }) : super(key: key);

  Asset? assetDetail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Box<dynamic> box = Hive.box(userInfoBox);
    final settings = ref.watch(appSettingsServiceProvider);
    final isLoadPreview = useState(AppSettingsEnum.loadPreview.defaultValue);
    final isLoadOriginal = useState(AppSettingsEnum.loadOriginal.defaultValue);
    final isZoomed = useState<bool>(false);
    final showAppBar = useState<bool>(true);
    final indexOfAsset = useState(assetList.indexOf(asset));
    final isPlayingMotionVideo = useState(false);
    final isPlayingVideo = useState(false);
    late Offset localPosition;
    final authToken = 'Bearer ${box.get(accessTokenKey)}';

    PageController controller =
        PageController(initialPage: assetList.indexOf(asset));

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

    void toggleFavorite(Asset asset) {
      ref.watch(favoriteProvider.notifier).toggleFavorite(asset);
    }

    getAssetExif() async {
      if (assetList[indexOfAsset.value].isRemote) {
        assetDetail = await ref
            .watch(assetServiceProvider)
            .getAssetById(assetList[indexOfAsset.value].id);
      } else {
        // TODO local exif parsing?
        assetDetail = assetList[indexOfAsset.value];
      }
    }

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
      return AssetEntityImageProvider(asset.local!);
    }

    void precacheNextImage(int index) {
      if (index < assetList.length && index > 0) {
        final asset = assetList[index];
        if (asset.isLocal) {
          // Preload the local asset
          precacheImage(localImageProvider(asset), context);
        } else {
          // Probably load WEBP either way
          precacheImage(
            remoteThumbnailImageProvider(
              asset,
              api.ThumbnailFormat.WEBP,
            ),
            context,
          );
          if (isLoadPreview.value) {
            // Precache the JPEG thumbnail
            precacheImage(
              remoteThumbnailImageProvider(
                asset,
                api.ThumbnailFormat.JPEG,
              ),
              context,
            );
          }
          if (isLoadOriginal.value) {
            // Preload the original asset
            precacheImage(
              originalImageProvider(asset),
              context,
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
          return ExifBottomSheet(assetDetail: assetDetail!);
        },
      );
    }

    void handleDelete(Asset deleteAsset) {
      showDialog(
        context: context,
        builder: (BuildContext _) {
          return DeleteDialog(
            onDelete: () {
              ref.watch(assetProvider.notifier).deleteAssets({deleteAsset});
              AutoRouter.of(context).pop(null);
            },
          );
        },
      );
    }

    void addToAlbum(Asset addToAlbumAsset) {
      showModalBottomSheet(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15.0),
        ),
        barrierColor: Colors.transparent,
        backgroundColor: Colors.transparent,
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

    buildAppBar() {
      final show = (showAppBar.value || // onTap has the final say
              (showAppBar.value && !isZoomed.value)) &&
          !isPlayingVideo.value;

      return AnimatedOpacity(
        duration: const Duration(milliseconds: 100),
        opacity: show ? 1.0 : 0.0,
        child: Container(
          color: Colors.black.withOpacity(0.4),
          child: TopControlAppBar(
            isPlayingMotionVideo: isPlayingMotionVideo.value,
            asset: assetList[indexOfAsset.value],
            isFavorite: ref.watch(favoriteProvider).contains(
                  assetList[indexOfAsset.value].id,
                ),
            onMoreInfoPressed: () {
              showInfo();
            },
            onFavorite: () {
              toggleFavorite(assetList[indexOfAsset.value]);
            },
            onDownloadPressed: assetList[indexOfAsset.value].isLocal
                ? null
                : () {
                    ref.watch(imageViewerStateProvider.notifier).downloadAsset(
                          assetList[indexOfAsset.value],
                          context,
                        );
                  },
            onSharePressed: () {
              ref
                  .watch(imageViewerStateProvider.notifier)
                  .shareAsset(assetList[indexOfAsset.value], context);
            },
            onToggleMotionVideo: (() {
              isPlayingMotionVideo.value = !isPlayingMotionVideo.value;
            }),
            onDeletePressed: () =>
                handleDelete((assetList[indexOfAsset.value])),
            onAddToAlbumPressed: () =>
                addToAlbum(assetList[indexOfAsset.value]),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
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
                    ? const BouncingScrollPhysics() // Use bouncing physics for iOS
                    : const ClampingScrollPhysics() // Use heavy physics for Android
                ),
            itemCount: assetList.length,
            scrollDirection: Axis.horizontal,
            onPageChanged: (value) {
              // Precache image
              if (indexOfAsset.value < value) {
                // Moving forwards, so precache the next asset
                precacheNextImage(value + 1);
              } else {
                // Moving backwards, so precache previous asset
                precacheNextImage(value - 1);
              }
              indexOfAsset.value = value;
              HapticFeedback.selectionClick();
            },
            loadingBuilder: isLoadPreview.value
                ? (context, event) {
                    final asset = assetList[indexOfAsset.value];
                    if (!asset.isLocal) {
                      // Use the WEBP Thumbnail as a placeholder for the JPEG thumbnail to achieve
                      // Three-Stage Loading (WEBP -> JPEG -> Original)
                      final webPThumbnail = CachedNetworkImage(
                        imageUrl: getThumbnailUrl(
                          asset,
                          type: api.ThumbnailFormat.WEBP,
                        ),
                        cacheKey: getThumbnailCacheKey(
                          asset,
                          type: api.ThumbnailFormat.WEBP,
                        ),
                        httpHeaders: {'Authorization': authToken},
                        progressIndicatorBuilder: (_, __, ___) => const Center(
                          child: ImmichLoadingIndicator(),
                        ),
                        fadeInDuration: const Duration(milliseconds: 0),
                        fit: BoxFit.contain,
                      );

                      return CachedNetworkImage(
                        imageUrl: getThumbnailUrl(
                          asset,
                          type: api.ThumbnailFormat.JPEG,
                        ),
                        cacheKey: getThumbnailCacheKey(
                          asset,
                          type: api.ThumbnailFormat.JPEG,
                        ),
                        httpHeaders: {'Authorization': authToken},
                        fit: BoxFit.contain,
                        fadeInDuration: const Duration(milliseconds: 0),
                        placeholder: (_, __) => webPThumbnail,
                      );
                    } else {
                      return Image(
                        image: localThumbnailImageProvider(asset),
                        fit: BoxFit.contain,
                      );
                    }
                  }
                : null,
            builder: (context, index) {
              getAssetExif();
              if (assetList[index].isImage && !isPlayingMotionVideo.value) {
                // Show photo
                final ImageProvider provider;
                if (assetList[index].isLocal) {
                  provider = localImageProvider(assetList[index]);
                } else {
                  if (isLoadOriginal.value) {
                    provider = originalImageProvider(assetList[index]);
                  } else {
                    provider = remoteThumbnailImageProvider(
                      assetList[index],
                      api.ThumbnailFormat.JPEG,
                    );
                  }
                }
                return PhotoViewGalleryPageOptions(
                  onDragStart: (_, details, __) =>
                      localPosition = details.localPosition,
                  onDragUpdate: (_, details, __) => handleSwipeUpDown(details),
                  onTapDown: (_, __, ___) =>
                      showAppBar.value = !showAppBar.value,
                  imageProvider: provider,
                  heroAttributes:
                      PhotoViewHeroAttributes(tag: assetList[index].id),
                  minScale: PhotoViewComputedScale.contained,
                );
              } else {
                return PhotoViewGalleryPageOptions.customChild(
                  onDragStart: (_, details, __) =>
                      localPosition = details.localPosition,
                  onDragUpdate: (_, details, __) => handleSwipeUpDown(details),
                  heroAttributes:
                      PhotoViewHeroAttributes(tag: assetList[index].id),
                  maxScale: 1.0,
                  minScale: 1.0,
                  child: SafeArea(
                    child: VideoViewerPage(
                      onPlaying: () => isPlayingVideo.value = true,
                      onPaused: () => isPlayingVideo.value = false,
                      asset: assetList[index],
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
        ],
      ),
    );
  }
}
