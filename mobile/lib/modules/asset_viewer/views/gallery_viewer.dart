import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/image_viewer_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:immich_mobile/modules/home/ui/delete_diaglog.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

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
      showModalBottomSheet(
        backgroundColor: Colors.black,
        barrierColor: Colors.transparent,
        isScrollControlled: false,
        context: context,
        builder: (context) {
          return ExifBottomSheet(assetDetail: assetDetail!);
        },
      );
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
      ),
      body: SafeArea(
        child: PageView.builder(
          controller: controller,
          pageSnapping: true,
          physics: isZoomed.value
              ? const NeverScrollableScrollPhysics()
              : const BouncingScrollPhysics(),
          itemCount: assetList.length,
          scrollDirection: Axis.horizontal,
          onPageChanged: (value) {
            indexOfAsset.value = value;
            HapticFeedback.selectionClick();
          },
          itemBuilder: (context, index) {
            getAssetExif();

            if (assetList[index].isImage) {
              if (isPlayingMotionVideo.value) {
                return VideoViewerPage(
                  asset: assetList[index],
                  isMotionVideo: true,
                  onVideoEnded: () {
                    isPlayingMotionVideo.value = false;
                  },
                );
              } else {
                return ImageViewerPage(
                  authToken: 'Bearer ${box.get(accessTokenKey)}',
                  isZoomedFunction: isZoomedMethod,
                  isZoomedListener: isZoomedListener,
                  asset: assetList[index],
                  heroTag: assetList[index].id,
                  loadPreview: isLoadPreview.value,
                  loadOriginal: isLoadOriginal.value,
                );
              }
            } else {
              return GestureDetector(
                onVerticalDragUpdate: (details) {
                  const int sensitivity = 15;
                  if (details.delta.dy > sensitivity) {
                    // swipe down
                    AutoRouter.of(context).pop();
                  } else if (details.delta.dy < -sensitivity) {
                    // swipe up
                    showInfo();
                  }
                },
                child: Hero(
                  tag: assetList[index].id,
                  child: VideoViewerPage(
                    asset: assetList[index],
                    isMotionVideo: false,
                    onVideoEnded: () {},
                  ),
                ),
              );
            }
          },
        ),
      ),
    );
  }
}
