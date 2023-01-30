import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/ui/add_to_album_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/remote_photo_view.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/image_viewer_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/modules/home/ui/delete_diaglog.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';

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
    ValueNotifier<bool> isZoomedListener = ValueNotifier<bool>(false);
    late Offset localPosition;

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

    //make isZoomed listener call instead
    void isZoomedMethod() {
      if (isZoomedListener.value) {
        isZoomed.value = true;
      } else {
        isZoomed.value = false;
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
            indexOfAsset.value = value;
            HapticFeedback.selectionClick();
          },
          builder: (context, index) {
            getAssetExif();
            final downloadAssetStatus =
              ref.watch(imageViewerStateProvider).downloadAssetStatus;

            final Widget child;
            if (assetList[index].isImage) {
              if (isPlayingMotionVideo.value) {
                 child = VideoViewerPage(
                  asset: assetList[index],
                  isMotionVideo: true,
                  onVideoEnded: () {
                    isPlayingMotionVideo.value = false;
                  },
                );
              } else {
                child = RemotePhotoView(
                  authToken: 'Bearer ${box.get(accessTokenKey)}',
                  isZoomedFunction: isZoomedMethod,
                  isZoomedListener: isZoomedListener,
                  asset: assetList[index],
                  loadPreview: isLoadPreview.value,
                  loadOriginal: isLoadOriginal.value,
                  onSwipeDown: () => {},
                  onSwipeUp: () => {},
                );
              }
            } else {
              child = VideoViewerPage(
                asset: assetList[index],
                isMotionVideo: false,
                onVideoEnded: () {},
              );
            }

            return PhotoViewGalleryPageOptions.customChild(
              gestureDetectorBehavior: HitTestBehavior.translucent,
              heroAttributes: PhotoViewHeroAttributes(tag: assetList[index].id),
              disableGestures: !assetList[index].isImage,
              child: GestureDetector(
                onVerticalDragStart: (down) => localPosition = down.localPosition,
                onVerticalDragUpdate: handleSwipeUpDown,
                onSecondaryTapDown: (_) => isZoomed.value = true,
                onSecondaryTapUp: (_) => isZoomed.value = false,
                child: child,
              ),
              minScale: PhotoViewComputedScale.contained,
            );
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
