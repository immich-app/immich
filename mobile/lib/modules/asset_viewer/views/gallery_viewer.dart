import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_swipe_detector/flutter_swipe_detector.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/image_viewer_page_state.provider.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_bottom_sheet.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/top_control_app_bar.dart';
import 'package:immich_mobile/modules/asset_viewer/views/image_viewer_page.dart';
import 'package:immich_mobile/modules/asset_viewer/views/video_viewer_page.dart';
import 'package:immich_mobile/modules/home/services/asset.service.dart';
import 'package:openapi/api.dart';

// ignore: must_be_immutable
class GalleryViewerPage extends HookConsumerWidget {
  late List<AssetResponseDto> assetList;
  final AssetResponseDto asset;

  static const _threeStageLoading = false;

  GalleryViewerPage({
    Key? key,
    required this.assetList,
    required this.asset,
  }) : super(key: key);

  AssetResponseDto? assetDetail;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Box<dynamic> box = Hive.box(userInfoBox);

    int indexOfAsset = assetList.indexOf(asset);
    final loading = useState(false);

    @override
    void initState(int index) {
      indexOfAsset = index;
    }

    PageController controller =
        PageController(initialPage: assetList.indexOf(asset));

    getAssetExif() async {
      assetDetail = await ref
          .watch(assetServiceProvider)
          .getAssetById(assetList[indexOfAsset].id);
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

    final isZoomed = useState<bool>(false);
    ValueNotifier<bool> isZoomedListener = ValueNotifier<bool>(false);

    //make isZoomed listener call instead
    void isZoomedMethod() {
      if (isZoomedListener.value) {
        isZoomed.value = true;
      } else {
        isZoomed.value = false;
      }
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: TopControlAppBar(
        loading: loading.value,
        asset: assetList[indexOfAsset],
        onMoreInfoPressed: () {
          showInfo();
        },
        onDownloadPressed: () {
          ref
              .watch(imageViewerStateProvider.notifier)
              .downloadAsset(assetList[indexOfAsset], context);
        }, onSharePressed: () {
          ref
              .watch(imageViewerStateProvider.notifier)
              .shareAsset(assetList[indexOfAsset], context);
        },
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
          itemBuilder: (context, index) {
            initState(index);
            getAssetExif();
            if (assetList[index].type == AssetTypeEnum.IMAGE) {
              return ImageViewerPage(
                authToken: 'Bearer ${box.get(accessTokenKey)}',
                isZoomedFunction: isZoomedMethod,
                isZoomedListener: isZoomedListener,
                onLoadingCompleted: () => loading.value = false,
                onLoadingStart: () => loading.value = _threeStageLoading,
                asset: assetList[index],
                heroTag: assetList[index].id,
                threeStageLoading: _threeStageLoading
              );
            } else {
              return SwipeDetector(
                onSwipeDown: (_) {
                  AutoRouter.of(context).pop();
                },
                onSwipeUp: (_) {
                  showInfo();
                },
                child: Hero(
                  tag: assetList[index].id,
                  child: VideoViewerPage(
                    asset: assetList[index],
                    videoUrl:
                        '${box.get(serverEndpointKey)}/asset/file?aid=${assetList[index].deviceAssetId}&did=${assetList[index].deviceId}',
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
