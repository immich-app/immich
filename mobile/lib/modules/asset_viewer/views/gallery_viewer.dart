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
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/modules/home/ui/delete_diaglog.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/photo_view/photo_view_gallery.dart';
import 'package:immich_mobile/photo_view/src/photo_view_computed_scale.dart';
import 'package:immich_mobile/photo_view/src/photo_view_scale_state.dart';
import 'package:immich_mobile/photo_view/src/utils/photo_view_hero_attributes.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:photo_manager/photo_manager.dart';

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
    final indexOfAsset = useState(assetList.indexOf(asset));
    final isPlayingMotionVideo = useState(false);
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

    void getAssetExif() async {
      if (assetList[indexOfAsset.value].isRemote) {
        assetDetail = await ref
            .watch(assetServiceProvider)
            .getAssetById(assetList[indexOfAsset.value].id);
      } else {
        // TODO local exif parsing?
        assetDetail = assetList[indexOfAsset.value];
      }
    }

    void precacheNextImage(int index) {
      if (index < assetList.length && index > 0) {
        final asset = assetList[index];
        if (asset.isLocal) {
          precacheImage(AssetEntityImageProvider(assetList[index].local!), context);
        } else {
          if (isLoadPreview.value) {
            precacheImage(
              CachedNetworkImageProvider(
                getThumbnailUrl(asset.remote!),
                cacheKey: getThumbnailCacheKey(asset.remote!),
                headers: {"Authorization": authToken},
              ),
              context,
            );
          }
          if (isLoadOriginal.value) {
            precacheImage(
              CachedNetworkImageProvider(
                getImageUrl(asset.remote!),
                cacheKey: getImageCacheKey(asset.remote!),
                headers: {"Authorization": authToken},
              ),
              context,
            );
          }

        }
      }
    }

    void showInfo() {
      if (assetList[indexOfAsset.value].isRemote) {
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
      int dxThreshhold = 50;

      if (isZoomed.value) {
        return;
      }

      // Check for delta from initial down point
      final d = details.localPosition - localPosition;
      // If the magnitude of the dx swipe is large, we probably didn't mean to go down
      if (d.dx.abs() > dxThreshhold) {
        return;
      }

      if (details.delta.dy > sensitivity) {
        AutoRouter.of(context).pop();
      } else if (details.delta.dy < -sensitivity) {
        showInfo();
      }
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: TopControlAppBar(
        isPlayingMotionVideo: isPlayingMotionVideo.value,
        asset: assetList[indexOfAsset.value],
        onMoreInfoPressed: () {
          showInfo();
        },
        onDownloadPressed: assetList[indexOfAsset.value].isLocal
            ? null
            : () {
                ref.watch(imageViewerStateProvider.notifier).downloadAsset(
                      assetList[indexOfAsset.value].remote!,
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
        onDeletePressed: () => handleDelete((assetList[indexOfAsset.value])),
        onAddToAlbumPressed: () => addToAlbum(assetList[indexOfAsset.value]),
      ),
      body: SafeArea(
        child: PhotoViewGallery.builder(
          scaleStateChangedCallback: (state) => isZoomed.value = state != PhotoViewScaleState.initial,
          pageController: controller,
          scrollPhysics: isZoomed.value
              ? const NeverScrollableScrollPhysics()
              : const ImmichPageViewScrollPhysics(),
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
          loadingBuilder: isLoadPreview.value ? (context, event) {
            if (!asset.isLocal) {
              return CachedNetworkImage(
                imageUrl: getThumbnailUrl(assetList[indexOfAsset.value].remote!),
                cacheKey: getThumbnailCacheKey(assetList[indexOfAsset.value].remote!),
                progressIndicatorBuilder: (_, __, ___) => const Center(child: ImmichLoadingIndicator(),),
                httpHeaders: { 'Authorization': authToken },
                fit: BoxFit.fitWidth,
              );
            } else {
              return Image(
                image: AssetEntityImageProvider(
                  assetList[indexOfAsset.value].local!,
                  isOriginal: false,
                  thumbnailSize: ThumbnailSize.square(MediaQuery.of(context).size.width.floor()),
                ),
              );
            }
          } : null,
          builder: (context, index) {
            getAssetExif();
            if (assetList[index].isImage && !isPlayingMotionVideo.value) {
              // Show photo
              final ImageProvider provider;
              if (assetList[index].isLocal) {
                provider = AssetEntityImageProvider(assetList[index].local!);
              } else {
                if (isLoadOriginal.value) {
                  provider = CachedNetworkImageProvider(
                    getImageUrl(assetList[index].remote!),
                    cacheKey: getImageCacheKey(assetList[index].remote!),
                    headers: {"Authorization": authToken},
                  );
                } else {
                  provider = CachedNetworkImageProvider(
                    getThumbnailUrl(assetList[index].remote!),
                    cacheKey: getThumbnailCacheKey(assetList[index].remote!),
                    headers: {"Authorization": authToken},
                  );
                }
              }
              return PhotoViewGalleryPageOptions(
                onDragStart: (_, details, __) => localPosition = details.localPosition,
                onDragUpdate: (_, details, __) => handleSwipeUpDown(details),
                imageProvider: provider,
                heroAttributes: PhotoViewHeroAttributes(tag: assetList[index].id),
                minScale: PhotoViewComputedScale.contained,
              );
            } else {
              return PhotoViewGalleryPageOptions.customChild(
                onDragStart: (_, details, __) => localPosition = details.localPosition,
                onDragUpdate: (_, details, __) => handleSwipeUpDown(details),
                heroAttributes: PhotoViewHeroAttributes(tag: assetList[index].id),
                child: VideoViewerPage(
                  asset: assetList[index],
                  isMotionVideo: isPlayingMotionVideo.value,
                  onVideoEnded: () {
                    if (isPlayingMotionVideo.value) {
                      isPlayingMotionVideo.value = false;
                    }
                  },
                ),
              );
            }
          },
        ),
      ),
    );
  }
}

class ImmichPageViewScrollPhysics extends ScrollPhysics {
  const ImmichPageViewScrollPhysics({super.parent});

  @override
  ImmichPageViewScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return ImmichPageViewScrollPhysics(parent: buildParent(ancestor)!);
  }

  @override
  SpringDescription get spring => const SpringDescription(
    mass: 100,
    stiffness: 100,
    damping: .90,
  );
}
